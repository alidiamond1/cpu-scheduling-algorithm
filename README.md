# CPU Scheduling Algorithms Simulator

A web-based application for simulating and visualizing CPU scheduling algorithms commonly studied in Operating Systems courses.

## Overview

This application allows users to:
- Simulate different CPU scheduling algorithms (FCFS, SJF, Priority, Round Robin)
- Input process data (arrival time, burst time, priority)
- Calculate waiting time and turnaround time for each process
- View average waiting time and turnaround time for each algorithm
- Understand the calculations with step-by-step explanations

## Features

- **Multiple Scheduling Algorithms**:
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF)
  - Priority Scheduling
  - Round Robin (with adjustable time quantum)

- **Real-time Calculations**:
  - Individual process metrics
  - Algorithm averages
  - Detailed explanations of calculation steps

- **Interactive UI**:
  - Add/remove processes dynamically
  - Adjust process parameters
  - Modern, responsive interface with Tailwind CSS

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript, jQuery
- **Styling**: Tailwind CSS

## Installation & Setup

1. Clone the repository
```bash
git clone <repository-url>
cd cpu-scheduling-simulator
```

2. Install dependencies
```bash
pip install flask flask_cors
```

3. Run the application
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Select a scheduling algorithm from the dropdown
2. For Round Robin, specify the time quantum
3. Add processes and set their parameters
4. Click "Calculate All" to see all metrics or use individual calculation buttons
5. View the results in the table and averages section
6. Explore the step-by-step explanations for each calculation

## Project Structure

```
.
├── app.py              # Flask backend with algorithm implementations
├── static/             # Static assets
│   ├── css/            # CSS styles
│   └── js/             # JavaScript files
│       ├── algorithms.js  # Algorithm explanations
│       ├── api.js         # API calls to backend
│       ├── main.js        # Main application logic
│       └── ui.js          # UI manipulation
└── templates/          # HTML templates
    └── index.html      # Main application page
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE). 