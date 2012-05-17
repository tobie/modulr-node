function chart() {
  function min(d) {
    return d[0][0];
  }
  
  function max(d) {
    return d[d.length-1][1];
  }
  
  function delta(d) {
    return max(d) - min(d);
  }
  
  function addTime(d) {
    return d.reduce(function(sum, tuple) {
      return sum + tuple[1] - tuple[0]
    }, 0);
  }
  
  function formatTime(d) {
    if (d === 0) {
      return "0"
    }
    if (d > 1000) {
      return (Math.round(d / 100) / 10) + 's';
    }
    return d + 'ms';
  }
  
  var height = 10,
      inner_height = height - 1,
      max_width = 1080,
      rootNode;
  
  function _chart(data) {
    var max_time = d3.max(data.map(max));
    
    rootNode = d3.select("#container").append("svg")
        .attr("class", "chart")
        .attr("width", max_width)
        .attr("height", height * data.length)
    
    var scaleX = d3.scale.linear()
        .domain([0, max_time])
        .range([0, max_width]);
    
    var ticks = scaleX.ticks(20);
    
    rootNode.selectAll("line")
      .data(ticks)
      .enter().append("line")
      .attr("x1", scaleX)
      .attr("x2", scaleX)
      .attr("y1", 0)
      .attr("y2", height * data.length)
      .style("stroke", "#ccc");
    
    rootNode.selectAll(".rule")
      .data(ticks)
      .enter().append("text")
      .attr("class", "rule")
      .attr("x", scaleX)
      .attr("y", 0)
      .attr("dy", -3)
      .attr("text-anchor", "middle")
      .text(String);
    
    rootNode.selectAll("line.bottom")
      .data(ticks)
      .enter().append("line")
      .attr("x1", scaleX)
      .attr("x2", scaleX)
      .attr("y1", 0)
      .attr("y2", height * data.length)
      .attr("class", "bottom")
      .style("stroke", "#eee");
    
    rootNode.selectAll(".rule-bottom")
      .data(ticks)
      .enter().append("text")
      .attr("class", "rule-bottom")
      .attr("x", scaleX)
      .attr("y", 0)
      .attr("dy", (height * data.length) + 10)
      .attr("text-anchor", "middle")
      .text(String);
    
    rootNode.append("line")
      .attr("y1", 0)
      .attr("y2", height * data.length)
      .style("stroke", "#000");
    
    var tip = d3.svg.tip();
    var rows = rootNode.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0, " + i * height + ")"; })
        .on('mouseover', function(d, i) {
          d3.select(this).attr('class', 'selected');
          tip.call(d3.select('rect.total').node(), d, i);
          tip.offset(function(d, i) {
            return [scaleX(min(d)), (i * height) + (height / 2)]
          }).padding(8).orient('right').text(function(d) {
            var n = d.node; output = [];
            output.push(n.id);
            output.push('Self: '  + formatTime(addTime(d)));
            if (n.evalStart) {
              output.push('Eval: '  + formatTime(n.evalEnd - n.evalStart));
            }
            output.push('Total: '  + formatTime(delta(d)));
            return output.join(' | ');
          }).attr('class', 'd3-tip');
        })
        .on('mouseout',  function() {
          d3.select(this).attr('class', '')
        });
    
    rows.append("rect")
      .attr("y", 0)
      .attr("x", 0)
      .attr("width", max_width)
      .attr("height", inner_height)
      .attr("class", "bckgrnd");

    rows.append("rect")
      .attr("y", 0)
      .attr("x", function(d, i) { return scaleX(min(d)); })
      .attr("width", function(d) { return scaleX(delta(d)); })
      .attr("height", inner_height)
      .attr("class", "total");

    rows.selectAll("rect.actual")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("y", 0)
      .attr("x", function(d, i) { return scaleX(d[0]); })
      .attr("width", function(d) { return scaleX(d[1] - d[0]); })
      .attr("height", inner_height)
      .attr("class", "actual");

    rows.append("rect")
      .attr("y", 0)
      .attr("x", function(d, i) { return scaleX(min(d)); })
      .attr("width", function(d) {
        var n = d.node;
        return n.evalStart ? scaleX(n.evalEnd - n.evalStart) : 0;
      })
      .attr("height", inner_height)
      .attr("class", "eval");
  }

  _chart.remove = function() {
    if (rootNode) { rootNode.remove(); }
    return _chart;
  }
  
  return _chart;
}  