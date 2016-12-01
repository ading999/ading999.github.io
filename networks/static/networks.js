
 $('#appcycle').click(function(){
    $("#radio_app").prop( "checked", true );
 });

function get_date_params(){
  var bdate = $('#bdate').val();
  var edate = $('#edate').val();
  return [bdate,edate];
}


  alert('hello!')

    function getdata(ticker,growth,pct_change,target,stop,begin_idx,end_idx,init=false){
      var cycle = growth?1:0;
      $.getJSON("/getdata/"+ticker+"/"+cycle+"/"+pct_change+"/"+target+"/"+stop+"/"
          +begin_idx+"/"+end_idx, function(result){
          res = result['result'];
          period_indices = result['period_indices'];
          if(1==result["error"]){
            console.log(result['error'])
            alert(result['err_msg'])
            return false;
          }
          data = result['series'];
          daterange = result['date_range']
          var len = daterange.length
          $('#bdate').val(daterange[0])
          $('#edate').val(daterange[len-1])
          $('.date_parameter').attr('min',daterange[0])
          $('.date_parameter').attr('max',daterange[len-1])
          try{
            plot(data,daterange,res);}
            catch(err){
                console.log(err.message);
            }
          if (init){
            window.dates = result['date_range']
            window.length = result['length']
          }
          $("#table").empty();


          $("#table").append("<table id='result_table' width='100%'></table>");
          $("#header_row").append("<th id='tableheader'></th>");
          $.each(DEFAULT_DISPLAY_COLS,function(i,field){
            $("#tableheader").append("<td>"+field+"</td")
          });
          $.each(res, function(i, field){
              tr_string = "<tr id=tr_>"
              first = tr_string.slice(0,10);
              last = tr_string.slice(10);
              $("#result_table").append(first+i+last);
              var str = $( "#ticker" ).val();
              $.each(field,function(n,s){
              $("#tr_"+i).append("<td>"+s.toString() + "</td>");
              });
            $("#tr_"+i).append("</tr>");

          });
          $("#table").append("</table>");
          //$('td').width(90)
           hash = result['hash']
          $('#download_button').click(function(){
            window.location.href = '/download/'+hash
          });
          $('#result_wrapper').show();
          $('#graph').show();

        });
                 return true;
    }

    function plot(data,dates){
      var minDate = dates[0]
      var maxDate = dates[dates.length-1]
      $("#graph").empty()
      $("#header_row").empty()
    
  redraw(0,dates.length-1,data,dates)
  
  var tooltip1 = $("<div/>")
                    .css({ position : 'relative' , color:"black","text-align":"center",width:"90px",top : 20, left : -45,background:"#FFFFFF" })
                    .attr("id","tooltip1").hide()

  var tooltip2 = $("<div/>")
                    .css({ position : 'relative' , color:"black","text-align":"center",width:"90px",top : 20, left : -45,background:"#FFFFFF" })
                    .attr("id","tooltip2").hide()


  $('#zoom_slider').slider({
        range: true,
        min: 0,
        max: dates.length-1,
        values: [ 0, dates.length-1 ],
        change: function( event, ui ) {
              redraw(ui.values[0],ui.values[1],window.data,window.dates)
        },
        slide:function(event,ui){
            sday = dates[ui.values[0]]
            eday = dates[ui.values[1]]
            $("#tooltip1").text(sday);
            $("#tooltip2").text(eday);
      }}).hover(function(){$("#tooltip1").show();
            $("#tooltip2").show();},function(){$("#tooltip1").hide();
            $("#tooltip2").hide();});
      $('.ui-slider-handle').first().append(tooltip1);
      $('.ui-slider-handle').last().append(tooltip2);
      $('#highlight').change(function() {
          if($("#highlight").prop( "checked" )){  
                $("rect").show();}
          else{
                $("rect").hide();}
      });
}



function redraw(begin_idx,end_idx,data,dates){
      var minDate = new Date(dates[begin_idx])
      var maxDate = new Date(dates[end_idx])
      var new_data = data.slice(begin_idx,end_idx+1)
      $("#graph").empty()
    var m = $("#graph").parent().width()*0.05
    var h = 400 - m*2; // height
    var w = $("#graph").parent().width()*0.9
    var x_scale = d3.scale.linear().domain([0, new_data.length-1]).range([0, w]);
    var index_scale = d3.scale.linear().domain([begin_idx, end_idx]).range([0, w]);

    var y = d3.scale.linear().domain([d3.min(new_data), d3.max(new_data)]).range([h, 0]);

    var line = d3.svg.line()
      .x(function(d,i) { 
        return x_scale(i); 
      })
      .y(function(d) { 
        return y(d); 
      })

      var graph = d3.select("#graph").append("svg:svg")
            .attr("height", h + m*2)
            .append("svg:g")
            .attr("width",w)
            .attr("transform", "translate("+m+"," +m+")");


      var x = d3.time.scale().domain([minDate,maxDate]).range([0, w]);
      var xAxis = split_x_ticker(x,new_data);

      graph.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate("+0+"," + h + ")")
            .call(xAxis)
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("font-size",10)
            .attr("transform", function(d) {
                return "rotate(-65)" 
                })
            .attr("id","xAxis");
      var yAxisLeft = d3.svg.axis().scale(y).ticks(10).orient("left");
      graph.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxisLeft)
            .selectAll("text")
            .attr("font-size",10);
  
  graph.append("svg:path").attr("d", line(new_data));
    
    $.each(period_indices, function(i, indices){
                  var start = indices['start_date']
                  var peak = indices['peak_date']
                  var end = indices['end_date']
                  if ((start>=begin_idx)&&(end<=end_idx)){
                  graph.append("rect")
                  .attr("x", index_scale(start))
                  .attr("y", 0)
                  .attr("width", index_scale(peak)-index_scale(start))
                  .attr("height", h)
                  .style("stroke-width", 1)
                  .style("fill", "green")
                  .style("opacity", 0.25);

                  graph.append("rect")
                  .attr("x", index_scale(peak))
                  .attr("y", 0)
                  .attr("width", index_scale(end)-index_scale(peak))
                  .attr("height", h)
                  .style("stroke-width", 1)
                  .style("fill", "red")
                  .style("opacity", 0.25);
                    
                    if($("#highlight").prop( "checked" )){  
                        $("rect").show();
                    }else{
                        $("rect").hide();
                      }
                }
              });
}


function split_x_ticker(scalar,ser){
  var len = ser.length
  if (len>=8000){
      return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.years, 2)
  }
  if (len>=3000){
    return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.years, 1)
  }
  if (len>=1000){
    return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.month, 5)
  }
  if (len>=300){
    return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.month, 1)
  }
  if (len>=20){
    return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.days, 10)
  }
  else{
    return d3.svg.axis().scale(scalar).orient('bottom').ticks(d3.time.days, 1)
  }

}

