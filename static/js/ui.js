// UI manipulation module
const UI = {
  // Initialize UI components
  initializeUI: function() {
    // Any initialization code for UI components
    console.log("UI initialized");
  },
  
  // Toggle quantum input visibility
  toggleQuantumInput: function(algorithm) {
    if (algorithm === "rr") {
      $("#quantum-container").removeClass("hidden");
    } else {
      $("#quantum-container").addClass("hidden");
    }
  },
  
  // Toggle priority column visibility
  togglePriorityColumn: function(algorithm) {
    if (algorithm === "priority") {
      $("#priority-header").removeClass("hidden");
      $(".priority-cell").removeClass("hidden");
    } else {
      $("#priority-header").addClass("hidden");
      $(".priority-cell").addClass("hidden");
    }
  },
  
  // Toggle arrival time column visibility
  toggleArrivalTimeColumn: function(algorithm) {
    if (algorithm === "fcfs" || algorithm === "rr" || algorithm === "priority") {
      $("#arrival-time-header").addClass("hidden");
      $(".arrival-time-cell").addClass("hidden");
    } else {
      $("#arrival-time-header").removeClass("hidden");
      $(".arrival-time-cell").removeClass("hidden");
    }
  },
  
  // Show algorithm explanation
  showAlgorithmExplanation: function(algorithm) {
    $(".algorithm-explanation").addClass("hidden");
    $(`#${algorithm}-explanation`).removeClass("hidden");
  },
  
  // Reset results
  resetResults: function() {
    $(".waiting-time, .turnaround-time").text("-");
    $("#avg-waiting-time, #avg-turnaround-time").text("-");
  },
  
  // Add a new process
  addProcess: function() {
    const rowCount = $("#process-body tr").length;
    const newRow = `
      <tr>
        <td class="border border-gray-300 px-4 py-2">P${rowCount + 1}</td>
        <td class="border border-gray-300 px-4 py-2 arrival-time-cell ${$("#algorithm").val() === "fcfs" ? "hidden" : ""}"><input type="number" min="0" value="0" class="arrival-time w-20 border rounded px-2 py-1"></td>
        <td class="border border-gray-300 px-4 py-2"><input type="number" min="1" value="1" class="burst-time w-20 border rounded px-2 py-1"></td>
        <td class="border border-gray-300 px-4 py-2 priority-cell ${$("#algorithm").val() === "priority" ? "" : "hidden"}"><input type="number" min="1" value="${rowCount + 1}" class="priority w-20 border rounded px-2 py-1"></td>
        <td class="border border-gray-300 px-4 py-2 waiting-time">-</td>
        <td class="border border-gray-300 px-4 py-2 turnaround-time">-</td>
        <td class="border border-gray-300 px-4 py-2">
          <button class="delete-process bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm">Delete</button>
        </td>
      </tr>
    `;
    $("#process-body").append(newRow);
    this.attachDeleteHandlers();
  },
  
  // Attach delete handlers to process rows
  attachDeleteHandlers: function() {
    $(".delete-process").off("click").on("click", function() {
      $(this).closest("tr").remove();
      UI.updateProcessIds();
      UI.resetResults();
    });
  },
  
  // Update process IDs after deletion
  updateProcessIds: function() {
    $("#process-body tr").each(function(index) {
      $(this).find("td:first").text(`P${index + 1}`);
    });
  },
  
  // Show calculation dialog
  showCalculationDialog: function(title, content) {
    $("#dialog-title").text(title);
    $("#dialog-content").html(content);
    $("#calculation-dialog").removeClass("hidden");
  },
  
  // Update process table with calculation results
  updateProcessTable: function(processes) {
    $("#process-body tr").each(function(index) {
      if (index < processes.length) {
        const process = processes[index];
        $(this).find(".waiting-time").text(process.waiting_time);
        $(this).find(".turnaround-time").text(process.turnaround_time);
      }
    });
  },
  
  // Update average times
  updateAverages: function(avgWaitingTime, avgTurnaroundTime) {
    $("#avg-waiting-time").text(avgWaitingTime.toFixed(2));
    $("#avg-turnaround-time").text(avgTurnaroundTime.toFixed(2));
  },
  
  // Generate Gantt chart for algorithm visualization
  createGanttChart: function(algorithm, processes, timeline) {
    const colors = ["bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-red-200", "bg-purple-200"];
    let html = `<div class="mb-5">
      <h5 class="font-medium mb-2">Process Execution Timeline:</h5>
      <div class="flex flex-wrap mb-4 overflow-x-auto">`;
    
    timeline.forEach((item, index) => {
      const color = item.id === "Idle" ? "bg-gray-200" : colors[(item.id - 1) % colors.length];
      html += `
        <div class="flex flex-col items-center">
          <div class="${color} px-4 py-2 border border-gray-300 text-center min-w-[50px]">
            ${item.id === "Idle" ? "Idle" : "P" + item.id}
          </div>
          <div class="text-xs text-gray-500">${item.start}</div>
        </div>
      `;
    });
    
    // Add the final time marker
    if (timeline.length > 0) {
      const lastTime = timeline[timeline.length - 1].end;
      html += `
        <div class="flex flex-col items-center">
          <div class="text-xs text-gray-500">${lastTime}</div>
        </div>
      `;
    }
    
    html += `</div></div>`;
    return html;
  },
  
  // Show visual result including Gantt chart
  showVisualResult: function(algorithm, processes) {
    const timeline = this.generateTimeline(algorithm, processes);
    let content = `
      <h4 class="font-bold text-lg mb-3">${algorithm.toUpperCase()} Algorithm Visualization</h4>
      ${this.createGanttChart(algorithm, processes, timeline)}
    `;
    
    this.showCalculationDialog(`${algorithm.toUpperCase()} - Visual Result`, content);
  },
  
  // Generate timeline for Gantt chart based on algorithm
  generateTimeline: function(algorithm, processes) {
    const timeline = [];
    let currentTime = 0;
    
    if (algorithm === "fcfs") {
      // Sort by arrival time
      const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
      
      sorted.forEach(process => {
        if (process.arrival_time > currentTime) {
          // Add idle time
          timeline.push({
            id: "Idle",
            start: currentTime,
            end: process.arrival_time
          });
          currentTime = process.arrival_time;
        }
        
        timeline.push({
          id: process.id,
          start: currentTime,
          end: currentTime + process.burst_time
        });
        
        currentTime += process.burst_time;
      });
    } 
    else if (algorithm === "sjf") {
      // SJF implementation
      const remaining = [...processes];
      
      while (remaining.length > 0) {
        // Find processes that have arrived
        const available = remaining.filter(p => p.arrival_time <= currentTime);
        
        if (available.length === 0) {
          // Jump to next arrival time
          const nextArrival = Math.min(...remaining.map(p => p.arrival_time));
          
          // Add idle time
          timeline.push({
            id: "Idle", 
            start: currentTime,
            end: nextArrival
          });
          
          currentTime = nextArrival;
          continue;
        }
        
        // Find shortest job
        const nextProcess = available.reduce((min, p) => 
          p.burst_time < min.burst_time ? p : min, available[0]);
        
        // Remove from remaining
        const idx = remaining.findIndex(p => p.id === nextProcess.id);
        remaining.splice(idx, 1);
        
        // Add to timeline
        timeline.push({
          id: nextProcess.id,
          start: currentTime,
          end: currentTime + nextProcess.burst_time
        });
        
        currentTime += nextProcess.burst_time;
      }
    }
    else if (algorithm === "priority") {
      // Priority implementation (non-preemptive)
      // Sort by priority
      const sorted = [...processes].sort((a, b) => a.priority - b.priority);
      
      sorted.forEach(process => {
        timeline.push({
          id: process.id,
          start: currentTime,
          end: currentTime + process.burst_time
        });
        
        currentTime += process.burst_time;
      });
    }
    else if (algorithm === "rr") {
      // Round Robin implementation
      const quantum = parseInt($("#quantum").val()) || 1;
      const remaining = [...processes].map(p => ({...p, remaining: p.burst_time}));
      let queue = [];
      
      // Initial queue based on arrival time
      const arrivalSorted = [...remaining].sort((a, b) => a.arrival_time - b.arrival_time);
      
      // Add processes that have arrived at time 0
      for (let i = 0; i < arrivalSorted.length; i++) {
        if (arrivalSorted[i].arrival_time <= currentTime) {
          queue.push(arrivalSorted[i]);
          arrivalSorted.splice(i, 1);
          i--;
        }
      }
      
      while (queue.length > 0 || arrivalSorted.length > 0) {
        if (queue.length === 0) {
          // No processes in queue, jump to next arrival
          currentTime = arrivalSorted[0].arrival_time;
          
          // Add idle time
          timeline.push({
            id: "Idle",
            start: currentTime - arrivalSorted[0].arrival_time,
            end: currentTime
          });
          
          // Add newly arrived processes
          while (arrivalSorted.length > 0 && arrivalSorted[0].arrival_time <= currentTime) {
            queue.push(arrivalSorted.shift());
          }
          continue;
        }
        
        // Get next process
        const current = queue.shift();
        
        // Run for quantum or remaining time
        const runTime = Math.min(quantum, current.remaining);
        
        timeline.push({
          id: current.id,
          start: currentTime,
          end: currentTime + runTime
        });
        
        current.remaining -= runTime;
        currentTime += runTime;
        
        // Add newly arrived processes
        while (arrivalSorted.length > 0 && arrivalSorted[0].arrival_time <= currentTime) {
          queue.push(arrivalSorted.shift());
        }
        
        // If process not finished, add back to queue
        if (current.remaining > 0) {
          queue.push(current);
        }
      }
    }
    
    return timeline;
  }
}; 