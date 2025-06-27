// API communication module
const API = {
  // Calculate all metrics
  calculateAll: function() {
    const algorithm = $("#algorithm").val();
    const processes = Algorithms.getProcessData();
    const data = this.prepareRequestData(algorithm, processes);
    
    console.log("Sending data to /calculate:", data);
    
    $.ajax({
      url: "/calculate",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function(response) {
        console.log("Received response:", response);
        
        // Update UI with results
        UI.updateProcessTable(response.processes);
        UI.updateAverages(response.avg_waiting_time, response.avg_turnaround_time);
        
        // For the "Calculate All" button, we only need to update the main table and the
        // average figures.  We intentionally avoid opening the explanation dialog or the
        // Gantt-chart visualisation here so that the UI simply refreshes the numeric
        // results in-place, in line with the desired behaviour.
        // If a calculation dialog is currently open (from a previous action) we hide it.
        $("#calculation-dialog").addClass("hidden");
      },
      error: function(error) {
        console.error("Error calculating results:", error);
        console.error("Error details:", JSON.stringify(error));
        alert("Error calculating results. Please check console for details.");
      }
    });
  },
  
  // Calculate waiting time
  calculateWaitingTime: function() {
    const algorithm = $("#algorithm").val();
    const processes = Algorithms.getProcessData();
    const data = this.prepareRequestData(algorithm, processes);
    
    $.ajax({
      url: "/calculate_waiting_time",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function(response) {
        // Update waiting times in UI
        $("#process-body tr").each(function(index) {
          $(this).find(".waiting-time").text(response.waiting_times[index]);
        });
        
        // Generate explanation based on algorithm
        let content = "";
        switch(algorithm) {
          case "fcfs":
            content = Algorithms.generateFCFSWaitingTimeExplanation(processes, response.waiting_times);
            break;
          case "sjf":
            content = Algorithms.generateSJFWaitingTimeExplanation(processes, response.waiting_times);
            break;
          case "priority":
            content = Algorithms.generatePriorityWaitingTimeExplanation(processes, response.waiting_times);
            break;
          case "rr":
            content = Algorithms.generateRRWaitingTimeExplanation(processes, response.waiting_times);
            break;
        }
        
        // Add visual chart to the content
        const timeline = UI.generateTimeline(algorithm, processes);
        const ganttChart = UI.createGanttChart(algorithm, processes, timeline);
        content = ganttChart + content;
        
        // Show explanation dialog
        UI.showCalculationDialog(`${algorithm.toUpperCase()} - Waiting Time Calculation`, content);
      },
      error: function(error) {
        console.error("Error calculating waiting time:", error);
        alert("Error calculating waiting time. Please check console for details.");
      }
    });
  },
  
  // Calculate turnaround time
  calculateTurnaroundTime: function() {
    const algorithm = $("#algorithm").val();
    const processes = Algorithms.getProcessData();
    const data = this.prepareRequestData(algorithm, processes);
    
    $.ajax({
      url: "/calculate_turnaround_time",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function(response) {
        // Update turnaround times in UI
        $("#process-body tr").each(function(index) {
          $(this).find(".turnaround-time").text(response.turnaround_times[index]);
        });
        
        // Generate timeline and chart
        const timeline = UI.generateTimeline(algorithm, processes);
        const ganttChart = UI.createGanttChart(algorithm, processes, timeline);
        
        // Show explanation dialog
        const title = `${algorithm.toUpperCase()} - Turnaround Time Calculation`;
        const content = ganttChart + API.generateTurnaroundTimeExplanation(algorithm, processes, response.turnaround_times);
        UI.showCalculationDialog(title, content);
      },
      error: function(error) {
        console.error("Error calculating turnaround time:", error);
        alert("Error calculating turnaround time. Please check console for details.");
      }
    });
  },
  
  // Calculate average waiting time
  calculateAvgWaitingTime: function() {
    const algorithm = $("#algorithm").val();
    const processes = Algorithms.getProcessData();
    const data = this.prepareRequestData(algorithm, processes);
    
    $.ajax({
      url: "/calculate_avg_waiting_time",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function(response) {
        // Update average waiting time
        $("#avg-waiting-time").text(response.avg_waiting_time.toFixed(2));
        
        // Generate timeline and chart
        const timeline = UI.generateTimeline(algorithm, processes);
        const ganttChart = UI.createGanttChart(algorithm, processes, timeline);
        
        // Show explanation dialog
        const title = `${algorithm.toUpperCase()} - Average Waiting Time Calculation`;
        const content = ganttChart + API.generateAvgWaitingTimeExplanation(algorithm, processes, response.avg_waiting_time);
        UI.showCalculationDialog(title, content);
      },
      error: function(error) {
        console.error("Error calculating average waiting time:", error);
        alert("Error calculating average waiting time. Please check console for details.");
      }
    });
  },
  
  // Calculate average turnaround time
  calculateAvgTurnaroundTime: function() {
    const algorithm = $("#algorithm").val();
    const processes = Algorithms.getProcessData();
    const data = this.prepareRequestData(algorithm, processes);
    
    $.ajax({
      url: "/calculate_avg_turnaround_time",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function(response) {
        // Update average turnaround time
        $("#avg-turnaround-time").text(response.avg_turnaround_time.toFixed(2));
        
        // Generate timeline and chart
        const timeline = UI.generateTimeline(algorithm, processes);
        const ganttChart = UI.createGanttChart(algorithm, processes, timeline);
        
        // Show explanation dialog
        const title = `${algorithm.toUpperCase()} - Average Turnaround Time Calculation`;
        const content = ganttChart + API.generateAvgTurnaroundTimeExplanation(algorithm, processes, response.avg_turnaround_time);
        UI.showCalculationDialog(title, content);
      },
      error: function(error) {
        console.error("Error calculating average turnaround time:", error);
        alert("Error calculating average turnaround time. Please check console for details.");
      }
    });
  },
  
  // Prepare request data
  prepareRequestData: function(algorithm, processes) {
    const data = {
      algorithm: algorithm,
      processes: processes
    };
    
    // Add quantum for RR
    if (algorithm === "rr") {
      data.quantum = parseInt($("#quantum").val());
    }
    
    return data;
  },
  
  // Generate dialog content for complete results
  generateDialogContent: function(algorithm, processes, response) {
    let content = `<h4 class="font-bold text-lg mb-2">${algorithm.toUpperCase()} - Complete Calculation Results</h4>`;
    
    // Add process table
    content += `<div class="overflow-x-auto my-4">
      <table class="min-w-full border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-4 py-2">Process</th>
            <th class="border px-4 py-2">Burst Time</th>
            ${algorithm !== "fcfs" ? '<th class="border px-4 py-2">Arrival Time</th>' : ''}
            ${algorithm === "priority" ? '<th class="border px-4 py-2">Priority</th>' : ''}
            <th class="border px-4 py-2">Waiting Time</th>
            <th class="border px-4 py-2">Turnaround Time</th>
          </tr>
        </thead>
        <tbody>`;
    
    response.processes.forEach(process => {
      content += `<tr>
        <td class="border px-4 py-2">P${process.id}</td>
        <td class="border px-4 py-2">${process.burst_time}</td>
        ${algorithm !== "fcfs" ? `<td class="border px-4 py-2">${process.arrival_time}</td>` : ''}
        ${algorithm === "priority" ? `<td class="border px-4 py-2">${process.priority}</td>` : ''}
        <td class="border px-4 py-2">${process.waiting_time}</td>
        <td class="border px-4 py-2">${process.turnaround_time}</td>
      </tr>`;
    });
    
    content += `</tbody></table></div>`;
    
    // Add averages section
    content += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div class="bg-blue-50 p-4 rounded-md">
        <h3 class="font-semibold">Average Waiting Time</h3>
        <p class="text-xl mt-1">${response.avg_waiting_time.toFixed(2)}</p>
      </div>
      <div class="bg-green-50 p-4 rounded-md">
        <h3 class="font-semibold">Average Turnaround Time</h3>
        <p class="text-xl mt-1">${response.avg_turnaround_time.toFixed(2)}</p>
      </div>
    </div>`;
    
    return content;
  },
  
  // Generate turnaround time explanation
  generateTurnaroundTimeExplanation: function(algorithm, processes, results) {
    let explanation = `<h4 class="font-bold text-lg mb-2">${algorithm.toUpperCase()} - Turnaround Time Calculation</h4>
      <p class="mb-3">Turnaround Time = Completion Time - Arrival Time</p>
      <p class="mb-3">Or equivalently: Turnaround Time = Waiting Time + Burst Time</p>
      
      <div class="overflow-x-auto">
        <table class="min-w-full border">
          <thead>
            <tr class="bg-gray-100">
              <th class="border px-4 py-2">Process</th>
              <th class="border px-4 py-2">Burst Time</th>
              <th class="border px-4 py-2">Waiting Time</th>
              <th class="border px-4 py-2">Calculation</th>
              <th class="border px-4 py-2">Turnaround Time</th>
            </tr>
          </thead>
          <tbody>`;
      
    // Assume we have waiting times calculated
    let waitingTimes = [];
    for(let i = 0; i < processes.length; i++) {
      waitingTimes[i] = results[i] - processes[i].burst_time;
    }
    
    processes.forEach((process, i) => {
      explanation += `
        <tr>
          <td class="border px-4 py-2">P${process.id}</td>
          <td class="border px-4 py-2">${process.burst_time}</td>
          <td class="border px-4 py-2">${waitingTimes[i]}</td>
          <td class="border px-4 py-2">${waitingTimes[i]} + ${process.burst_time} = ${results[i]}</td>
          <td class="border px-4 py-2">${results[i]}</td>
        </tr>
      `;
    });
    
    explanation += `</tbody></table></div>`;
      
    return explanation;
  },
  
  // Generate average waiting time explanation
  generateAvgWaitingTimeExplanation: function(algorithm, processes, avgWaitingTime) {
    let explanation = `<h4 class="font-bold text-lg mb-2">${algorithm.toUpperCase()} - Average Waiting Time Calculation</h4>
      <p class="mb-3">Average Waiting Time = Sum of all processes' waiting times / Number of processes</p>
      
      <div class="bg-gray-100 p-3 rounded-md my-4">
        <p class="font-medium">Formula:</p>
        <p>Average WT = (Sum of Waiting Times) / ${processes.length}</p>
        <p class="mt-2 font-bold">Result: ${avgWaitingTime.toFixed(2)}</p>
      </div>`;
      
    return explanation;
  },
  
  // Generate average turnaround time explanation
  generateAvgTurnaroundTimeExplanation: function(algorithm, processes, avgTurnaroundTime) {
    let explanation = `<h4 class="font-bold text-lg mb-2">${algorithm.toUpperCase()} - Average Turnaround Time Calculation</h4>
      <p class="mb-3">Average Turnaround Time = Sum of all processes' turnaround times / Number of processes</p>
      
      <div class="bg-gray-100 p-3 rounded-md my-4">
        <p class="font-medium">Formula:</p>
        <p>Average TAT = (Sum of Turnaround Times) / ${processes.length}</p>
        <p class="mt-2 font-bold">Result: ${avgTurnaroundTime.toFixed(2)}</p>
      </div>`;
      
    return explanation;
  }
}; 