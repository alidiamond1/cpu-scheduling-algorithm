// Algorithm explanation module
const Algorithms = {
  // Get process data from the table
  getProcessData: function() {
    const processes = [];
    const algorithm = $("#algorithm").val();
    
    console.log("Getting process data for algorithm:", algorithm);
    
    $("#process-body tr").each(function(index) {
      try {
        const process = {
          id: index + 1,
          burst_time: parseInt($(this).find(".burst-time").val()) || 1 // Default to 1 if NaN
        };
        
        // Add arrival time for all algorithms (needed by backend)
        // For SJF, use user input
        // For FCFS, Priority, and RR, use 0 or index to maintain order
        if (algorithm === "sjf") {
          process.arrival_time = parseInt($(this).find(".arrival-time").val()) || 0;
        } else {
          // For FCFS, Priority and RR, set arrival time to 0 or index to maintain order  
          process.arrival_time = algorithm === "fcfs" ? index : 0;
        }
        
        // Add priority if required
        if (algorithm === "priority") {
          process.priority = parseInt($(this).find(".priority").val()) || index + 1;
        }
        
        console.log(`Process ${index + 1} data:`, process);
        processes.push(process);
      } catch (err) {
        console.error("Error processing row", index, err);
      }
    });
    
    return processes;
  },
  
  // Generate FCFS waiting time explanation
  generateFCFSWaitingTimeExplanation: function(processes, results) {
    let explanation = `
      <p class="mb-3">In First-Come, First-Served scheduling, processes are executed in the order they arrive in the ready queue. The waiting time for each process is calculated as follows:</p>
      <ul class="list-disc ml-6 mb-4">
        <li>The first process has a waiting time of 0</li>
        <li>For subsequent processes, waiting time = previous process waiting time + previous process burst time</li>
        <li>Formula: wt[i] = bt[i-1] + wt[i-1]</li>
      </ul>
    `;
    
    // Use the original order (which reflects FCFS execution) so that the calculation
    // steps align one-to-one with the waiting-time results coming from the backend.
    explanation += this.createCalculationTable(processes, results);
    
    return explanation;
  },
  
  // Generate SJF waiting time explanation
  generateSJFWaitingTimeExplanation: function(processes, results) {
    const order = this.computeSJFExecutionOrder(processes);

    // Re-compute waiting times in the same execution order so that the
    // explanation is self-contained and independent of the order used when
    // the server returns the array.
    const waitingTimes = [];
    order.forEach((proc, i) => {
      if (i === 0) {
        waitingTimes.push(0);
      } else {
        const prev = order[i - 1];
        const wt = Math.max(0, waitingTimes[i - 1] + prev.burst_time + prev.arrival_time - proc.arrival_time);
        waitingTimes.push(wt);
      }
    });

    let explanation = `
      <p class="mb-3">In <strong>Shortest-Job-First (SJF)</strong> scheduling, the CPU is
      allocated to the process with the <em>smallest</em> burst time among the
      processes that have already arrived.  Below are the step-by-step waiting-time
      calculations following that execution order.</p>
      <ul class="list-disc ml-6 mb-4">
        <li>The first selected process has a waiting time of <code>0</code>.</li>
        <li>For every other process:<br/>
          <code>WT[i] = WT[i-1] + BT[i-1] + AT[i-1] − AT[i]</code></li>
      </ul>
    `;

    explanation += this.createSJFCalculationTable(order, waitingTimes);

    return explanation;
  },
  
  // Generate Priority waiting time explanation
  generatePriorityWaitingTimeExplanation: function(processes, results) {
    /*
      Priority (non-preemptive – lower number = higher priority)
      Executes processes in ascending priority order.  Waiting times are
      accumulated sequentially, giving the well-known formula:

          WT[i] = WT[i-1] + BT[i-1]

      where the index is with respect to the <strong>priority-sorted</strong> list.
    */

    // Build lookup <id -> waiting_time> from the results array (which is in
    // the same order as the original process table).
    const wtLookup = {};
    processes.forEach((p, idx) => {
      wtLookup[p.id] = results[idx];
    });

    // Sort a copy of the processes by priority (ascending).
    const sorted = [...processes].sort((a, b) => a.priority - b.priority);

    // Compose explanatory text.
    let explanation = `
      <p class="mb-3">In <strong>Priority Scheduling</strong> the CPU is allocated to the
      process with the <em>highest</em> priority (i.e. the <em>lowest</em> numerical value).
      The waiting time for each process is computed cumulatively, using:</p>
      <p class="mb-4"><code>WT[i] = WT[i-1] + BT[i-1]</code> &nbsp;&nbsp;for&nbsp; i &gt; 0, &nbsp;and&nbsp;
      <code>WT[0] = 0</code></p>`;

    explanation += this.createPriorityCalculationTable(sorted, wtLookup);

    return explanation;
  },
  
  // Generate RR waiting time explanation (shows per-round schedule)
  generateRRWaitingTimeExplanation: function(processes, results) {
    const quantum = parseInt($("#quantum").val()) || 1;

    // Build execution slices for all rounds
    const schedule = this.computeRRSchedule(processes, quantum);

    let explanation = `
      <p class="mb-3"><strong>Round&nbsp;Robin</strong> scheduling waxay siisa CPU-ga
      process walba <em>quantum</em> ah (<code>${quantum}</code>). Marka process-ku uusan
      dhammayn quantum-kiisa, waxa dib loogu darayaa dabada safka si uu uga
      qeyb-galo wareegga xiga.</p>`;

    // Add schedule table (rounds)
    explanation += this.createRRScheduleTable(schedule);

    // Add final waiting-time summary with completion-time and formula
    explanation += `<h4 class="font-bold mt-4 mb-2">Waiting Time Summary</h4>`;
    explanation += this.createRRWaitingSummary(processes, schedule, results);

    return explanation;
  },
  
  // Generate generic explanation (placeholder)
  generateGenericExplanation: function(algorithm, processes, results) {
    return `
      <h4 class="font-bold text-lg mb-2">${algorithm} Explanation</h4>
      <p>Algorithm: ${algorithm}</p>
      <p>Total processes: ${processes.length}</p>
    `;
  },
  
  // Helper method to create calculation table
  createCalculationTable: function(processes, results) {
    let tableHtml = `<div class="overflow-x-auto"><table class="min-w-full border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-4 py-2">Process</th>
          <th class="border px-4 py-2">Burst Time</th>
          <th class="border px-4 py-2">Calculation</th>
          <th class="border px-4 py-2">Result</th>
        </tr>
      </thead>
      <tbody>`;
    
    processes.forEach((process, i) => {
      let calculation;
      if (i === 0) {
        // First process always has waiting time 0 in non-preemptive algorithms like FCFS
        calculation = `WT(P${process.id}) = 0 (first process)`;
      } else {
        const prevProcess = processes[i - 1];
        calculation = `WT(P${process.id}) = WT(P${prevProcess.id}) + BT(P${prevProcess.id}) = ${results[i - 1]} + ${prevProcess.burst_time} = ${results[i]}`;
      }
      
      tableHtml += `
        <tr>
          <td class="border px-4 py-2">P${process.id}</td>
          <td class="border px-4 py-2">${process.burst_time}</td>
          <td class="border px-4 py-2">${calculation}</td>
          <td class="border px-4 py-2">${results[i] ?? '?'}</td>
        </tr>
      `;
    });
    
    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  },

  /* ------------------------------------------------------------------
   *  Helper: build execution order for SJF (non-preemptive)
   * ----------------------------------------------------------------*/
  computeSJFExecutionOrder: function(processes) {
    const remaining = [...processes];
    const order = [];
    let currentTime = 0;

    while (remaining.length > 0) {
      // Find all processes that have already arrived
      const available = remaining.filter(p => p.arrival_time <= currentTime);

      if (available.length === 0) {
        // Jump to the next arrival time if nothing is ready
        currentTime = Math.min(...remaining.map(p => p.arrival_time));
        continue;
      }

      // Pick the process with the smallest burst-time (ties -> first in list)
      let next = available[0];
      available.forEach(p => {
        if (p.burst_time < next.burst_time) {
          next = p;
        }
      });

      // Remove from remaining list
      const idx = remaining.findIndex(p => p.id === next.id);
      if (idx > -1) remaining.splice(idx, 1);

      // Push to execution order and advance time
      order.push(next);
      currentTime += next.burst_time;
    }

    return order;
  },

  /* ------------------------------------------------------------------
   *  Helper: create calculation table for SJF waiting times
   * ----------------------------------------------------------------*/
  createSJFCalculationTable: function(order, waitingTimes) {
    let html = `<div class="overflow-x-auto"><table class="min-w-full border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-4 py-2">#</th>
          <th class="border px-4 py-2">Process</th>
          <th class="border px-4 py-2">AT</th>
          <th class="border px-4 py-2">BT</th>
          <th class="border px-4 py-2">Calculation</th>
          <th class="border px-4 py-2">WT</th>
        </tr>
      </thead>
      <tbody>`;

    order.forEach((proc, i) => {
      let calc;
      if (i === 0) {
        calc = `WT(P${proc.id}) = 0`;
      } else {
        const prev = order[i - 1];
        calc = `WT(P${proc.id}) = WT(P${prev.id}) + BT(P${prev.id}) + AT(P${prev.id}) - AT(P${proc.id}) = ` +
               `${waitingTimes[i - 1]} + ${prev.burst_time} + ${prev.arrival_time} - ${proc.arrival_time} = ${waitingTimes[i]}`;
      }

      const wt = waitingTimes[i];
      html += `
        <tr>
          <td class="border px-4 py-2 text-center">${i + 1}</td>
          <td class="border px-4 py-2">P${proc.id}</td>
          <td class="border px-4 py-2">${proc.arrival_time}</td>
          <td class="border px-4 py-2">${proc.burst_time}</td>
          <td class="border px-4 py-2 text-sm">${calc}</td>
          <td class="border px-4 py-2">${wt}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  },

  /* ------------------------------------------------------------------
   *  Helper: create calculation table for Priority waiting times
   * ----------------------------------------------------------------*/
  createPriorityCalculationTable: function(sortedProcesses, wtLookup) {
    let html = `<div class="overflow-x-auto"><table class="min-w-full border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-4 py-2">Order</th>
          <th class="border px-4 py-2">Process</th>
          <th class="border px-4 py-2">Priority</th>
          <th class="border px-4 py-2">BT</th>
          <th class="border px-4 py-2">Calculation</th>
          <th class="border px-4 py-2">WT</th>
        </tr>
      </thead>
      <tbody>`;

    sortedProcesses.forEach((proc, i) => {
      const btPrev = i === 0 ? 0 : sortedProcesses[i - 1].burst_time;
      const wtPrev = i === 0 ? 0 : wtLookup[sortedProcesses[i - 1].id];
      const wtCurr = wtLookup[proc.id];

      const calc = i === 0
        ? `WT(P${proc.id}) = 0`
        : `WT(P${proc.id}) = WT(P${sortedProcesses[i - 1].id}) + BT(P${sortedProcesses[i - 1].id}) = ${wtPrev} + ${btPrev} = ${wtCurr}`;

      html += `
        <tr>
          <td class="border px-4 py-2 text-center">${i + 1}</td>
          <td class="border px-4 py-2">P${proc.id}</td>
          <td class="border px-4 py-2">${proc.priority}</td>
          <td class="border px-4 py-2">${proc.burst_time}</td>
          <td class="border px-4 py-2 text-sm">${calc}</td>
          <td class="border px-4 py-2">${wtCurr}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  },

  /* ------------------------------------------------------------------
   *  Helper: simulate RR schedule, returns array of slices {idx, pid, start, run, remaining}
   * ----------------------------------------------------------------*/
  computeRRSchedule: function(processes, quantum) {
    const slices = [];
    const remaining = processes.map(p => ({...p, remaining: p.burst_time}));
    let currentTime = 0;
    let queue = [];
    const arrival = [...remaining].sort((a, b) => a.arrival_time - b.arrival_time);

    // Populate initial queue
    while (arrival.length && arrival[0].arrival_time <= currentTime) {
      queue.push(arrival.shift());
    }

    let round = 1;
    while (queue.length || arrival.length) {
      if (!queue.length) {
        currentTime = arrival[0].arrival_time;
        while (arrival.length && arrival[0].arrival_time <= currentTime) {
          queue.push(arrival.shift());
        }
      }

      const proc = queue.shift();
      const runTime = Math.min(quantum, proc.remaining);

      slices.push({idx: round++, pid: proc.id, start: currentTime, run: runTime, remaining_before: proc.remaining, remaining_after: proc.remaining - runTime});

      proc.remaining -= runTime;
      currentTime += runTime;

      // enqueue newly arrived
      while (arrival.length && arrival[0].arrival_time <= currentTime) {
        queue.push(arrival.shift());
      }

      if (proc.remaining > 0) {
        queue.push(proc);
      }
    }

    return slices;
  },

  /* ------------------------------------------------------------------
   *  Helper: table for RR slices
   * ----------------------------------------------------------------*/
  createRRScheduleTable: function(slices) {
    let html = `<h4 class="font-semibold mt-4 mb-2">Per-Round Schedule</h4>`;
    html += `<div class="overflow-x-auto"><table class="min-w-full border text-xs md:text-sm">
      <thead><tr class="bg-gray-100">
        <th class="border px-2 py-1">Round</th>
        <th class="border px-2 py-1">Process</th>
        <th class="border px-2 py-1">Start</th>
        <th class="border px-2 py-1">Run</th>
        <th class="border px-2 py-1">Remaining&nbsp;Before</th>
        <th class="border px-2 py-1">Remaining&nbsp;After</th>
      </tr></thead><tbody>`;

    slices.forEach(s => {
      html += `<tr>
        <td class="border px-2 py-1 text-center">${s.idx}</td>
        <td class="border px-2 py-1 text-center">P${s.pid}</td>
        <td class="border px-2 py-1 text-center">${s.start}</td>
        <td class="border px-2 py-1 text-center">${s.run}</td>
        <td class="border px-2 py-1 text-center">${s.remaining_before}</td>
        <td class="border px-2 py-1 text-center">${s.remaining_after}</td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  },

  /* ------------------------------------------------------------------
   *  Helper: waiting time summary table (simple)
   * ----------------------------------------------------------------*/
  createRRWaitingSummary: function(processes, schedule, waitingTimes) {
    // Determine completion time for each process (last slice end)
    const completion = {};
    schedule.forEach(s => {
      completion[s.pid] = s.start + s.run; // last occurrence will overwrite → last end = completion time
    });

    let html = `<div class="overflow-x-auto"><table class="min-w-full border">
      <thead><tr class="bg-gray-100 text-xs md:text-sm">
        <th class="border px-2 py-1">Process</th>
        <th class="border px-2 py-1">Burst Time (BT)</th>
        <th class="border px-2 py-1">Completion Time (CT)</th>
        <th class="border px-2 py-1">WT = CT − BT</th>
      </tr></thead><tbody>`;

    processes.forEach((p, i) => {
      const ct = completion[p.id];
      const wt = waitingTimes[i];
      html += `<tr>
        <td class="border px-2 py-1">P${p.id}</td>
        <td class="border px-2 py-1 text-center">${p.burst_time}</td>
        <td class="border px-2 py-1 text-center">${ct}</td>
        <td class="border px-2 py-1 text-center">${ct} − ${p.burst_time} = ${wt}</td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  }
}; 