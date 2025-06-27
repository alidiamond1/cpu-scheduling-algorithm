$(document).ready(function() {
  // Initialize UI components
  UI.initializeUI();
  
  // Initialize event handlers
  initializeEventHandlers();
  
  // Set default algorithm state
  setInitialState();
  
  function initializeEventHandlers() {
    // Algorithm selection change handler
    $("#algorithm").change(function() {
      const algorithm = $(this).val();
      
      // Show/hide quantum input for Round Robin
      UI.toggleQuantumInput(algorithm);
      
      // Show/hide priority column for Priority algorithm
      UI.togglePriorityColumn(algorithm);
      
      // Show/hide arrival time column - only show for SJF
      UI.toggleArrivalTimeColumn(algorithm);
      
      // Show appropriate algorithm explanation
      UI.showAlgorithmExplanation(algorithm);
      
      // Reset results
      UI.resetResults();
    });
    
    // Add new process button handler
    $("#add-process").click(function() {
      UI.addProcess();
    });
    
    // Dialog close button handler
    $("#close-dialog").click(function() {
      $("#calculation-dialog").addClass("hidden");
    });
    
    // Calculate buttons handlers
    $("#calculate-all").click(function() {
      API.calculateAll();
    });
    
    $("#calculate-waiting-time").click(function() {
      API.calculateWaitingTime();
    });
    
    $("#calculate-turnaround-time").click(function() {
      API.calculateTurnaroundTime();
    });
    
    $("#calculate-avg-waiting-time").click(function() {
      API.calculateAvgWaitingTime();
    });
    
    $("#calculate-avg-turnaround-time").click(function() {
      API.calculateAvgTurnaroundTime();
    });
  }
  
  function setInitialState() {
    // Show the first algorithm explanation by default
    $(".algorithm-explanation").addClass("hidden");
    $("#fcfs-explanation").removeClass("hidden");
    
    // Set initial state for arrival time column (hide for FCFS which is selected by default)
    const initialAlgorithm = $("#algorithm").val();
    if (initialAlgorithm === "fcfs") {
      $("#arrival-time-header").addClass("hidden");
      $(".arrival-time-cell").addClass("hidden");
    }
    
    // Attach delete handlers for existing processes
    UI.attachDeleteHandlers();
  }
}); 