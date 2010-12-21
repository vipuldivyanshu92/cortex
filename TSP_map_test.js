function map_test(value)
{
	var TSPSatSolverHelper = function(graph, current, visited, distance, numberVisited, order, res)
	{	
		visited[current] = numberVisited;
	
		if (distance - graph[current][0] < 0)
		{
			visited[current] = 0;
			return false;
		}
	
		if (numberVisited >= graph.length)
		{
			for (var index = 0; index < visited.length; index++)
				order[visited[index] - 1] = index;
		
			visited[current] = 0;
			return true;
		}	
	
		for (var next = 0; next < graph.length; next++)
			if (graph[current][next] != 0 && visited[next] <= 0 && TSPSatSolverHelper(graph, next, visited, distance - graph[current][next], numberVisited + 1, order))
				return true;

		visited[current] = 0;
		return false;
	}
	
	var TSPSatSolver = function(graph, distance, order)
	{
		var visited = new Array(graph.length);
	
		for (var index = 0; index < graph.length; index++)
			visited[index] = 0;
		
		return TSPSatSolverHelper(graph, 0, visited, distance, 1, order, false);
	}
	
	var cities = 8;
	var graph = [ [0,8,2,4,5,7,0,0], 
		  [8,0,0,5,0,2,3,4],	
		  [2,0,0,1,7,0,8,3],
		  [4,5,1,0,0,0,3,2],
		  [5,0,7,0,0,1,5,6],
		  [7,2,0,0,1,0,1,4],
		  [0,3,8,3,5,1,0,0],
		  [0,4,3,2,6,4,0,0]];
		  //new Array(cities);
		  
	var order = new Array(cities);
	
	for (var index = 0; index < cities; index++)
		order[index] = 0;
	
	/*for (var row = 0; row < graph.length; row++)
		graph[row] = new Array(cities);
	
	for(var ii = 0; ii < cities; ii++)
		for(var jj = 0; jj < cities; jj++)
			graph[ii][jj] = (ii == jj ? 0 : 2);
			
	graph[1][2] = 1;
	graph[2][1] = 1;
	
	graph[1][3] = 1;
	graph[3][1] = 1;
	*/
	var result = TSPSatSolver(graph, value, order);
	
	
	//return result;
	if (result == true) 
		return order;
	else
		return false;
}

function reduce(list)
{
	var r = new Array();
	
	for (var i = 0; i < list.length; i++)
	{
		if (list[i].value != false)
		{
			r.push(list[i]);
			break;
		}
	}
	
	return r;
}

