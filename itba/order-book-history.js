function datachart(tickValue) {
  var dims = d3.select("#chart").node().getBoundingClientRect();
  var chart_sizeX = dims.width;// (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth)-50;
  var chart_sizeY = dims.height;//(window.innerHeight|| document.documentElement.clientHeight || document.body.clientHeight)-50;

  var chart_margin = {top: 10, right: 10, bottom: 150, left: 40},
      chart_margin2 = {top: chart_sizeY-120, right: 10, bottom: 20, left: 40},
      chart_width = chart_sizeX - chart_margin.left - chart_margin.right,
      chart_height = chart_sizeY - chart_margin.top - chart_margin.bottom,
      chart_height2 = chart_sizeY - chart_margin2.top - chart_margin2.bottom;
  var chart_parseDate = d3.time.format("%b %Y").parse;
  var chart_x = d3.time.scale().range([0, chart_width]),
      chart_x2 = d3.time.scale().range([0, chart_width]),
      chart_y = d3.scale.linear().range([chart_height, 0]),
      chart_volumeScaleBids = d3.scale.linear().range([chart_height2/2-2, 0]);
      chart_volumeScaleOffers = d3.scale.linear().range([chart_height2/2-2, 0]);

  var currentData=[];
  var compactData=[];
  var data_index=0;
  var tick=tickValue;
  var step=tickValue;
  var verticalZoom=1;

  function chart_xAxis2() {return d3.svg.axis().scale(chart_x2).orient("bottom")};
  function chart_xAxis() {return d3.svg.axis().scale(chart_x).orient("bottom").ticks(15)};
  function chart_yAxis() {return d3.svg.axis().scale(chart_y).orient("left").ticks(10)};

  var brush = d3.svg.brush()
      .x(chart_x2)
      .on("brush", brushed);

  var bidVolumes = d3.svg.area()
      .interpolate("step-before")
      .x(function(d) { return chart_x2(d.timestamp); })
      .y1(chart_height2/2)
      .y0(function(d) {
  	return 2+chart_height2-chart_volumeScaleBids(d3.sum(d.bids,
  		function (e,i){return e[1];
  	}))});


  var offerVolumes = d3.svg.area()
        .interpolate("step-before")
        .x(function(d) { return chart_x2(d.timestamp); })
        .y0(chart_height2/2-2)
        .y1(function(d) {
    	return chart_volumeScaleOffers(d3.sum(d.offers,
    		function (e,i){return e[1];
    	}))});

  var bidOverlay = d3.svg.area()
      .interpolate("step-after")
      .x(function(d) { return chart_x(d.timestamp); })
      .y0(chart_height)
      .y1(function(d) {
        return (d.bids.length>0?chart_y(d.bids[d.bids.length-1][0]):chart_height);
      });

  var offerOverlay = d3.svg.area()
      .interpolate("step-after")
      .x(function(d) { return chart_x(d.timestamp); })
      .y0(0)
      .y1(function(d) {
        return (d.offers.length>0?chart_y(d.offers[0][0]):0);
      });

  var chartzoom = d3.behavior.zoom()
    .center([chart_width / 2, 0])
    .on("zoom", zoomed);

  var chartsvg = d3.select("#chart").append("svg")
      .attr("width", chart_width + chart_margin.left + chart_margin.right)
      .attr("height", chart_height + chart_margin.top + chart_margin.bottom);

  chartsvg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", chart_width)
      .attr("height", chart_height)
  var context = chartsvg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + chart_margin2.left + "," + chart_margin2.top + ")");

  var chartLayer = chartsvg.append("g")
          .attr("class", "focus")
          .attr("transform", "translate(" + chart_margin.left + "," + chart_margin.top + ")");
  var priceLayer = chartsvg.append("g")
          .attr("class", "prices")
          .attr("transform", "translate(" + chart_margin.left + "," + chart_margin.top + ")");
  var labelLayer = chartsvg.append("g")
          .attr("transform", "translate(" + chart_margin.left + "," + chart_margin.top + ")");

  var hoverLayer = chartsvg.append("g");
  var hoverRect = hoverLayer.append("rect")
      .attr("x", chart_margin.left)
      .attr("y", chart_margin.top)
      .attr("width", chart_width)
      .attr("height", chart_height)
      .style("fill-opacity",0)
      .call(chartzoom);

  var hoverLine = hoverLayer.append("line")
  				.attr("x1", chart_margin.left).attr("x2", chart_margin.left)
  				.attr("y1", chart_margin.top).attr("y2", chart_height+chart_margin.top)
          .attr("class", "hoverline")
          .style("visibility","hidden")
          .call(chartzoom);

  var parent = this;

  var notificationDiv = d3.select("#chart").append("div")
    .style("position", "absolute")
    .style("top", "1px")
    .style("left", "45%");

  function showMessage(message) {
      notificationDiv.html("");
      notificationDiv.append("p")
          .text(message)
          .style("background", "#FAA")
          .style("color", "#000")
        .transition()
          .duration(1500)
          .style("opacity", 1e-6)
          .remove();
    }

  hoverRect.on("click",function() {
    if (d3.event.defaultPrevented) return;
    var coords=d3.mouse(this);
    var xcoord=coords[0];

    hoverLine.attr("x1", xcoord).attr("x2", xcoord).style("visibility","visible");

    var scale=d3.scale.linear().domain([chart_margin.left, chart_width+chart_margin.left]).range(chart_x.domain());
    var i=0;
    var hoverTimestamp=scale(xcoord);
    while (data[i].timestamp<hoverTimestamp) {
       i++;
    }
    data_index = i-1;
    parent.chartclick(data[data_index]);
  });

  d3.select("body").on("keydown", function (e) {
    if (d3.event.srcElement==d3.select("#date")[0][0]) {
      return;
    }
     var k=d3.event.keyCode;
     console.log(k);

     var ticks=[.001,.005,.01,.05,.1,.5,1,5,10];
     var steps=[.001,.001,.01,.01,.1,.1,1,1,10];

     if (k>=49 && k<=58) {
       tick=ticks[k-49];
       step=steps[k-49];
       parent.update_chart(currentData, true);
       showMessage("Tick="+tick);
     }
     if (k==81) { //q
       tick=tick-step;
       if (tick<=0) {
         tick=step;
       }
       parent.update_chart(currentData, true);
       showMessage("Tick="+tick.toPrecision(1));
     }

     if (k==87) { //w
       tick=tick+step;
       parent.update_chart(currentData, true);
        showMessage("Tick="+tick.toPrecision(1));
     }
     if (k==65) { //a
       verticalZoom-=.001;
       if (verticalZoom<=0) {
         verticalZoom=.001;
       }
       redraw();
       showMessage("Zoom="+verticalZoom*100+"%");
     }

     if (k==83) { //s
       verticalZoom+=.001;
       redraw();
       showMessage("Zoom="+verticalZoom*100+"%");
     }


     if (k==37) { //left
       if (data_index>0) {
         data_index-=1;
         recenterOnLine();
         updateHoverLine();
         parent.chartclick(data[data_index]);
       }
     } else if (k==39) { //right
       if (data_index<data.length-1) {
         data_index+=1;
         recenterOnLine();
         updateHoverLine();
         parent.chartclick(data[data_index]);
       }
     } else if (k==38) {
       scalezoom(1.1);
       updateBrush();
       redraw();
     } else if (k==40) {
       scalezoom(0.9);
       updateBrush();
       redraw();
     }

  });

  function scalezoom(zoomscale) {
    var scale=d3.scale.linear().domain([chart_margin.left, chart_width+chart_margin.left]).range(chart_x.domain());
    var xcoord=scale.invert(currentData[data_index].timestamp);
    hoverRect.call(chartzoom.event);
    var center0 = [xcoord,0], translate0 = chartzoom.translate(), coordinates0 = coordinates(center0);
    chartzoom.scale(chartzoom.scale()*zoomscale);
    var center1 = point(coordinates0);
    chartzoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

  }

  function coordinates(point) {
    var scale = chartzoom.scale(), translate = chartzoom.translate();
    return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
  }
  function point(coordinates) {
    var scale = chartzoom.scale(), translate = chartzoom.translate();
    return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
  }

  function recenterOnLine() {
    var scale=d3.scale.linear().domain([chart_margin.left, chart_width+chart_margin.left]).range(chart_x.domain());
    var xcoord=scale.invert(currentData[data_index].timestamp);
    var translation=0;
    if (xcoord<chart_margin.left) {
      translation = -100;
    }
    if (xcoord>chart_width+chart_margin.left) {
      translation = 100;
    }
    if (translation!=0) {
      chartzoom.translate([chartzoom.translate()[0] - translation, chartzoom.translate()[1]]);
      var brushExtent = [chart_x.invert(0), chart_x.invert(chart_width)];
      context.select(".brush").call(brush.extent(brushExtent));
      redraw();
    }
  }


  function updateHoverLine() {

    var scale=d3.scale.linear().domain([chart_margin.left, chart_width+chart_margin.left]).range(chart_x.domain());
    var xcoord=scale.invert(currentData[data_index].timestamp);
    if (xcoord>=chart_margin.left && xcoord<=chart_width+chart_margin.left) {
      hoverLine.attr("x1", xcoord).attr("x2", xcoord).style("visibility","visible");
    } else {
      hoverLine.style("visibility","hidden");
    }
  }

  this.update = function() {
      brushed();
  }

  function brushed() {
    hoverLine.style("visibility","hidden");
    chart_x.domain(brush.empty() ? chart_x2.domain() : brush.extent());
    chartzoom.x(chart_x);
    console.log(brush.extent());
    redraw()
  }

  function zoomed() {
    hoverLine.style("visibility","hidden");
    var xmin=chart_x2.domain()[0];
    var xmax=chart_x2.domain()[1];


    if (chart_x.domain()[0] < xmin) {
      chartzoom.translate([chartzoom.translate()[0] - chart_x(xmin) + chart_x.range()[0], chartzoom.translate()[1]]);
    } else if (chart_x.domain()[1] > xmax) {
      chartzoom.translate([chartzoom.translate()[0] - chart_x(xmax) + chart_x.range()[1], chartzoom.translate()[1]]);
    }
    //console.log(chartzoom.scale());
    //console.log(chartzoom.translate());
    //console.log(brush.extent());

    updateBrush();
    redraw();
  }

  function updateBrush() {
    var xmin=chart_x2.domain()[0];
    var xmax=chart_x2.domain()[1];

    if (chart_x.domain()[0] <= xmin && chart_x.domain()[1] >= xmax) {
      context.select(".brush").call(brush.clear());
    } else{
      var brushExtent = [chart_x.invert(0), chart_x.invert(chart_width)];
      context.select(".brush").call(brush.extent(brushExtent));
    }
  }
  function redraw() {

    var maxy=d3.max(compactData.map(function(d) {
      return d3.max(d.offers.map(function(e) {
          if ((e[2]<chart_x.domain()[0] && e[3]<chart_x.domain()[0]) ||
              (e[2]>chart_x.domain()[1] && e[3]>chart_x.domain()[1])) {
                return null;
          }
          return e[0];
      }))
    }));
    var miny=d3.min(compactData.map(function(d) {
      return d3.min(d.bids.map(function(e) {
          if ((e[2]<chart_x.domain()[0] && e[3]<chart_x.domain()[0]) ||
              (e[2]>chart_x.domain()[1] && e[3]>chart_x.domain()[1])) {
                return null;
          }
          return e[0];
      }))
    }));

    chart_y.domain([miny*(1.0/verticalZoom)-tick, maxy*verticalZoom+tick]); //Hay qye buscar max y min en el dominio de x

    priceLayer.selectAll(".price").attr("d", createPriceArea());
    priceLayer.selectAll(".bidoverlay").attr("d", bidOverlay);
    priceLayer.selectAll(".offeroverlay").attr("d", offerOverlay);

    chartLayer.select(".x.axis").call(chart_xAxis().tickSize(-chart_height, 0, 0));
    chartLayer.select(".y.axis").call(chart_yAxis().tickSize(-chart_width, 0, 0));

    updateHoverLine();

  }


  function createPriceArea() {
       return d3.svg.area()
      	.x(function(d,i) {
            return chart_x(d.timestamp);
  	     })
  	      .y0(function(d) {
            return chart_y(d.priceFrom);
          })
  	      .y1(function(d) {
            return chart_y(d.priceTo);
          });

    }


    function createAreas(bookSideData,tick, scale ) {
    	for (var j = 0; j < bookSideData.length ; j++) {
    		var price=bookSideData[j][0];
    		var size=bookSideData[j][1];
        var timestampFrom=bookSideData[j][2];
        var timestampTo=bookSideData[j][3];

    		priceLayer.append("path").datum(
    			[{"timestamp":new Date(timestampFrom), "priceFrom":price-tick/2, "priceTo":price+tick/2},
    			 {"timestamp":new Date(timestampTo), "priceFrom":price-tick/2, "priceTo":price+tick/2}]
    			)
    		      .attr("class", "price")
    		      .style("fill", scale(size))
    		      .attr("d", createPriceArea());
    	}
  }

  function createCompactData(p) {
    var data=JSON.parse(JSON.stringify(p));
    for (var i = 0; i < data.length; i++) {
      var d=data[i];
      for (var j = 0; j < d.bids.length; j++) {
         var bid=d.bids[j];
         var timestampFrom=new Date(d.timestamp);
         var timestampTo=new Date(data[i+1]?data[i+1].timestamp:timestampFrom);
         var found=true;
         for (var k = i+1; found && k < data.length; k++) {
           found=false;
           var d2=data[k];
           for (var l = d2.bids.length-1; l>=0 ; l--) {
             var bid2=d2.bids[l];
             if (bid2[0]==bid[0] && bid2[1]==bid[1]) {
               timestampTo=new Date(data[k+1]?data[k+1].timestamp:data[k].timestamp);
               found=true;
               d2.bids.splice(l,1);
             }
           }
         }
         bid.push(timestampFrom);
         bid.push(timestampTo);
      }
      for (var j = 0; j < d.offers.length; j++) {
         var offer=d.offers[j];
         var timestampFrom=new Date(d.timestamp);
         var timestampTo=new Date(data[i+1]?data[i+1].timestamp:timestampFrom);
         var found=true;
         for (var k = i+1; found && k < data.length; k++) {
           found=false;
           var d2=data[k];
           for (var l = d2.offers.length-1; l>=0 ; l--) {
             var offer2=d2.offers[l];
             if (offer2[0]==offer[0] && offer2[1]==offer[1]) {
               timestampTo=new Date(data[k+1]?data[k+1].timestamp:data[k].timestamp);
               found=true;
               d2.offers.splice(l,1);
             }
           }
         }
         offer.push(timestampFrom);
         offer.push(timestampTo);
      }
    }
    return data;
  }



  this.update_chart = function(data, onlyPrices) {
    console.log("Updating...");
    currentData=data;
    var maxOfferPrice = d3.max(currentData.map(function(d) { return d.offers.length>0?d.offers[d.offers.length-1][0]:0; }))
    var minBidPrice = d3.min(currentData.map(function(d) { return d.bids.length>0?d.bids[d.bids.length-1][0]:maxOfferPrice; }))
    var maxOfferSize = d3.max(currentData.map(function(d) { return d3.max(d.offers.map(function(f) {return f[1];})); }))
    var maxBidSize = d3.max(currentData.map(function(d) { return d3.max(d.bids.map(function(f) {return f[1];})); }))
    var minOfferSize = d3.min(currentData.map(function(d) { return d3.min(d.offers.map(function(f) {return f[1];})); }))
    var minBidSize = d3.min(currentData.map(function(d) { return d3.min(d.bids.map(function(f) {return f[1];})); }))

    var minSize = d3.min([minOfferSize, minBidSize]);
    var maxSize = d3.max([maxOfferSize, maxBidSize]);

    var colorScaleBids = d3.scale.linear().domain([minSize, (minSize+maxSize)/2, maxSize]).range(['#0000ff', '#00ff00','#ff0000'])
    var colorScaleOffers = d3.scale.linear().domain([minSize, (minSize+maxSize)/2, maxSize]).range(['#0000ff', '#00ff00','#ff0000'])

    if (onlyPrices) {
      priceLayer.selectAll(".price").remove();
    } else {
      priceLayer.selectAll(".price").remove();
      priceLayer.selectAll(".bidoverlay").remove();
      priceLayer.selectAll(".offeroverlay").remove();
      chart_x.domain(d3.extent(currentData.map(function(d) { return d.timestamp; })));
      chart_y.domain([minBidPrice, maxOfferPrice]);
      chart_x2.domain(chart_x.domain());
      chart_volumeScaleBids.domain([0, d3.max(currentData.map(function(d) {return d3.sum(d.bids, function (e,i){return e[1];});}))]);
      chart_volumeScaleOffers.domain([0, d3.max(currentData.map(function(d) {return d3.sum(d.offers, function (e,i){return e[1];});}))]);
      context.selectAll(".bidarea").remove();
      context.selectAll(".offerarea").remove();
      chartLayer.selectAll(".x.axis").remove();
      chartLayer.selectAll(".y.axis").remove();
      context.selectAll(".x.axis").remove();
      context.selectAll(".x.brush").remove();



    chartLayer.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + chart_height + ")")
        .call(chart_xAxis().tickSize(-chart_height, 0, 0));
    chartLayer.append("g")
        .attr("class", "y axis")
        .call(chart_yAxis().tickSize(-chart_width, 0, 0));
    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + chart_height2 + ")")
        .call(chart_xAxis2());

    context.append("path")
            .datum(currentData)
            .attr("class", "bidarea")
            .attr("d", bidVolumes);
    context.append("path")
            .datum(currentData)
            .attr("class", "offerarea")
            .attr("d", offerVolumes);

    priceLayer.append("path")
            .datum(currentData)
            .attr("class", "bidoverlay")
            .attr("d", bidOverlay);

    priceLayer.append("path")
            .datum(currentData)
            .attr("class", "offeroverlay")
            .attr("d", offerOverlay);


    context.append("g")
          .attr("class", "x brush")
          .call(brush)
          .call(chartzoom)
        .selectAll("rect")
          .attr("y", -6)
          .attr("height", chart_height2 + 7);
    }

    compactData=createCompactData(currentData);

    for (var i = 0; i < compactData.length; i++) {
       console.log("Creating areas "+i+"/"+compactData.length);
  	   var d=compactData[i];
  	   var timestampFrom=d.timestamp;
  	   var timestampTo=(compactData[i+1]?compactData[i+1].timestamp:timestampFrom);
       createAreas(d.bids, tick, colorScaleBids);
       createAreas(d.offers, tick, colorScaleOffers);
    }

    if (!onlyPrices) {
      chartzoom.x(chart_x);
    }
    redraw();
    parent.chartclick(currentData[data_index]);
    console.log("Updated");
  }

  this.chartclick = function() {
  }
}
