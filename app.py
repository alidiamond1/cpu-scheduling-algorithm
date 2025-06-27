from flask import Flask, render_template, request, jsonify
import json
from flask_cors import CORS  # Import CORS support

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# CPU Scheduling Algorithms
def fcfs_algorithm(processes):
    """First-Come, First-Served (FCFS) scheduling algorithm"""
    n = len(processes)
    result = []
    
    # Sort processes by arrival time
    processes.sort(key=lambda x: x['arrival_time'])
    
    # Calculate waiting time and turnaround time
    current_time = 0
    for i, p in enumerate(processes):
        process_id = p['id']
        arrival_time = p['arrival_time']
        burst_time = p['burst_time']
        
        # Update current time if process arrives after the current time
        if arrival_time > current_time:
            current_time = arrival_time
        
        # Calculate waiting time using the formula from slides
        if i == 0:
            waiting_time = 0  # First process has waiting time 0
        else:
            # Formula: wt[i] = bt[i-1] + wt[i-1]
            prev_process = result[i-1]
            waiting_time = prev_process['burst_time'] + prev_process['waiting_time']
        
        turnaround_time = waiting_time + burst_time
        current_time += burst_time
        
        result.append({
            'id': process_id,
            'arrival_time': arrival_time,
            'burst_time': burst_time,
            'waiting_time': waiting_time,
            'turnaround_time': turnaround_time
        })
    
    return result

def sjf_algorithm(processes):
    """Shortest-Job-First (SJF) scheduling algorithm (non-preemptive)"""
    n = len(processes)
    result = []
    remaining_processes = processes.copy()
    current_time = 0
    
    # First, find the order of execution
    execution_order = []
    
    while remaining_processes:
        ready_processes = [p for p in remaining_processes if p['arrival_time'] <= current_time]
        
        if not ready_processes:
            # No processes available, jump to next arrival time
            current_time = min(remaining_processes, key=lambda x: x['arrival_time'])['arrival_time']
            continue
        
        # Select the process with shortest burst time
        next_process = min(ready_processes, key=lambda x: x['burst_time'])
        remaining_processes.remove(next_process)
        
        # Add to execution order
        execution_order.append(next_process)
        
        # Update current time
        current_time += next_process['burst_time']
    
    # Now calculate waiting time and turnaround time using the formula from slides
    for i, p in enumerate(execution_order):
        process_id = p['id']
        arrival_time = p['arrival_time']
        burst_time = p['burst_time']
        
        # Calculate waiting time
        if i == 0:
            waiting_time = 0  # First process has waiting time 0
        else:
            # Formula: wt[i] = bt[i-1] + wt[i-1] + at[i-1] - at[i]
            prev_process = result[i-1]
            waiting_time = (prev_process['burst_time'] + 
                           prev_process['waiting_time'] + 
                           prev_process['arrival_time'] - 
                           arrival_time)
            
            # Waiting time cannot be negative
            waiting_time = max(0, waiting_time)
        
        turnaround_time = waiting_time + burst_time
        
        result.append({
            'id': process_id,
            'arrival_time': arrival_time,
            'burst_time': burst_time,
            'waiting_time': waiting_time,
            'turnaround_time': turnaround_time
        })
    
    return result

def priority_algorithm(processes):
    """Priority scheduling algorithm (lower number = higher priority)"""
    n = len(processes)
    result = []
    
    # Ensure each process has a priority value
    for p in processes:
        if 'priority' not in p:
            p['priority'] = p['id']  # Default priority to process ID if not provided
    
    # Sort processes ONLY by priority (lower number = higher priority)
    # No consideration of arrival time for sorting
    sorted_processes = sorted(processes, key=lambda x: x['priority'])
    
    # Calculate waiting time and turnaround time using the formula from slides
    for i, p in enumerate(sorted_processes):
        process_id = p['id']
        burst_time = p['burst_time']
        priority = p['priority']
        
        # Calculate waiting time
        if i == 0:
            waiting_time = 0  # First process has waiting time 0
        else:
            # Formula: WT[i] = WT[i-1] + BT[i-1]
            prev_process = result[i-1]
            waiting_time = prev_process['waiting_time'] + prev_process['burst_time']
        
        # Calculate turnaround time
        turnaround_time = waiting_time + burst_time
        
        result.append({
            'id': process_id,
            'arrival_time': 0,  # Set arrival time to 0 for all processes
            'burst_time': burst_time,
            'priority': priority,
            'waiting_time': waiting_time,
            'turnaround_time': turnaround_time
        })
    
    return result

def rr_algorithm(processes, quantum):
    """Round Robin (RR) scheduling algorithm"""
    n = len(processes)
    result = [{
        'id': p['id'],
        'arrival_time': p['arrival_time'],
        'burst_time': p['burst_time'],
        'waiting_time': 0,
        'turnaround_time': 0,
        'remaining_time': p['burst_time']
    } for p in processes]
    
    current_time = 0
    queue = []
    
    # Sort processes by arrival time
    process_queue = sorted(list(range(n)), key=lambda i: processes[i]['arrival_time'])
    
    completed = 0
    while completed < n:
        # Add newly arrived processes to the queue
        while process_queue and processes[process_queue[0]]['arrival_time'] <= current_time:
            queue.append(process_queue.pop(0))
            
        if not queue:
            if process_queue:
                # Jump to the next arrival time if no processes in queue
                current_time = processes[process_queue[0]]['arrival_time']
                continue
            else:
                # All processes are done
                break
        
        # Get next process from queue
        i = queue.pop(0)
        
        # Execute for quantum time or until completion
        execution_time = min(quantum, result[i]['remaining_time'])
        current_time += execution_time
        result[i]['remaining_time'] -= execution_time
        
        # Add newly arrived processes during this quantum
        while process_queue and processes[process_queue[0]]['arrival_time'] <= current_time:
            queue.append(process_queue.pop(0))
            
        # If process is not completed, put it back in the queue
        if result[i]['remaining_time'] > 0:
            queue.append(i)
        else:
            # Process completed
            completed += 1
            # Calculate turnaround time and waiting time
            result[i]['turnaround_time'] = current_time - processes[i]['arrival_time']
            result[i]['waiting_time'] = result[i]['turnaround_time'] - processes[i]['burst_time']
    
    # Clean up temporary fields
    for r in result:
        del r['remaining_time']
    
    return result

def calculate_averages(processes):
    """Calculate average waiting time and turnaround time"""
    total_waiting_time = sum(p['waiting_time'] for p in processes)
    total_turnaround_time = sum(p['turnaround_time'] for p in processes)
    n = len(processes)
    
    return {
        'avg_waiting_time': total_waiting_time / n if n > 0 else 0,
        'avg_turnaround_time': total_turnaround_time / n if n > 0 else 0
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['GET', 'POST'])
def calculate():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    data = request.get_json()
    processes = data['processes']
    algorithm = data['algorithm']
    quantum = data.get('quantum', 1)
    
    for i, p in enumerate(processes):
        p['id'] = i + 1
    
    if algorithm == 'fcfs':
        result = fcfs_algorithm(processes)
    elif algorithm == 'sjf':
        result = sjf_algorithm(processes)
    elif algorithm == 'priority':
        result = priority_algorithm(processes)
    elif algorithm == 'rr':
        result = rr_algorithm(processes, quantum)
    else:
        return jsonify({'error': 'Invalid algorithm'})
    
    # Ensure the results are returned in the same order as the original
    # input table (i.e., sorted by process ID). This prevents the frontend
    # from mis-aligning waiting/turnaround times when algorithms change the
    # execution order internally (e.g., SJF or Priority).
    result = sorted(result, key=lambda p: p['id'])
    
    averages = calculate_averages(result)
    
    return jsonify({
        'processes': result,
        'avg_waiting_time': averages['avg_waiting_time'],
        'avg_turnaround_time': averages['avg_turnaround_time']
    })

@app.route('/calculate_waiting_time', methods=['GET', 'POST'])
def calculate_waiting_time():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    data = request.get_json()
    processes = data['processes']
    algorithm = data['algorithm']
    quantum = data.get('quantum', 1)
    
    for i, p in enumerate(processes):
        p['id'] = i + 1
    
    if algorithm == 'fcfs':
        result = fcfs_algorithm(processes)
    elif algorithm == 'sjf':
        result = sjf_algorithm(processes)
    elif algorithm == 'priority':
        result = priority_algorithm(processes)
    elif algorithm == 'rr':
        result = rr_algorithm(processes, quantum)
    else:
        return jsonify({'error': 'Invalid algorithm'})
    
    # Ensure the results are returned in the same order as the original
    # input table (i.e., sorted by process ID). This prevents the frontend
    # from mis-aligning waiting/turnaround times when algorithms change the
    # execution order internally (e.g., SJF or Priority).
    result = sorted(result, key=lambda p: p['id'])
    
    return jsonify({
        'waiting_times': [p['waiting_time'] for p in result]
    })

@app.route('/calculate_turnaround_time', methods=['GET', 'POST'])
def calculate_turnaround_time():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    data = request.get_json()
    processes = data['processes']
    algorithm = data['algorithm']
    quantum = data.get('quantum', 1)
    
    for i, p in enumerate(processes):
        p['id'] = i + 1
    
    if algorithm == 'fcfs':
        result = fcfs_algorithm(processes)
    elif algorithm == 'sjf':
        result = sjf_algorithm(processes)
    elif algorithm == 'priority':
        result = priority_algorithm(processes)
    elif algorithm == 'rr':
        result = rr_algorithm(processes, quantum)
    else:
        return jsonify({'error': 'Invalid algorithm'})
    
    # Ensure the results are returned in the same order as the original
    # input table (i.e., sorted by process ID). This prevents the frontend
    # from mis-aligning waiting/turnaround times when algorithms change the
    # execution order internally (e.g., SJF or Priority).
    result = sorted(result, key=lambda p: p['id'])
    
    return jsonify({
        'turnaround_times': [p['turnaround_time'] for p in result]
    })

@app.route('/calculate_avg_waiting_time', methods=['GET', 'POST'])
def calculate_avg_waiting_time():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    data = request.get_json()
    processes = data['processes']
    algorithm = data['algorithm']
    quantum = data.get('quantum', 1)
    
    for i, p in enumerate(processes):
        p['id'] = i + 1
    
    if algorithm == 'fcfs':
        result = fcfs_algorithm(processes)
    elif algorithm == 'sjf':
        result = sjf_algorithm(processes)
    elif algorithm == 'priority':
        result = priority_algorithm(processes)
    elif algorithm == 'rr':
        result = rr_algorithm(processes, quantum)
    else:
        return jsonify({'error': 'Invalid algorithm'})
    
    # Ensure the results are returned in the same order as the original
    # input table (i.e., sorted by process ID). This prevents the frontend
    # from mis-aligning waiting/turnaround times when algorithms change the
    # execution order internally (e.g., SJF or Priority).
    result = sorted(result, key=lambda p: p['id'])
    
    averages = calculate_averages(result)
    
    return jsonify({
        'avg_waiting_time': averages['avg_waiting_time']
    })

@app.route('/calculate_avg_turnaround_time', methods=['GET', 'POST'])
def calculate_avg_turnaround_time():
    if request.method != 'POST':
        return jsonify({'error': 'Method not allowed'}), 405
        
    data = request.get_json()
    processes = data['processes']
    algorithm = data['algorithm']
    quantum = data.get('quantum', 1)
    
    for i, p in enumerate(processes):
        p['id'] = i + 1
    
    if algorithm == 'fcfs':
        result = fcfs_algorithm(processes)
    elif algorithm == 'sjf':
        result = sjf_algorithm(processes)
    elif algorithm == 'priority':
        result = priority_algorithm(processes)
    elif algorithm == 'rr':
        result = rr_algorithm(processes, quantum)
    else:
        return jsonify({'error': 'Invalid algorithm'})
    
    # Ensure the results are returned in the same order as the original
    # input table (i.e., sorted by process ID). This prevents the frontend
    # from mis-aligning waiting/turnaround times when algorithms change the
    # execution order internally (e.g., SJF or Priority).
    result = sorted(result, key=lambda p: p['id'])
    
    averages = calculate_averages(result)
    
    return jsonify({
        'avg_turnaround_time': averages['avg_turnaround_time']
    })

if __name__ == '__main__':
    app.run(debug=True)
