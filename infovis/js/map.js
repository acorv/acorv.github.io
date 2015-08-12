window.onload = function() {

  d3.select(".loading").style("display","none");
	d3.select(".wrapper").style("display","block");


  var baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution: '',
      maxZoom: 18
    }
  );
  var cfg = {
    "radius": 0.005,     // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    "maxOpacity": .8,
    "scaleRadius": true,     // scales the radius based on map zoom
    "useLocalExtrema": true,     // if set to false the heatmap uses the global maximum for colorization if activated:
    latField: 'lat',
    lngField: 'lng',
    valueField: 'count'
  };
  var heatmapLayer = new HeatmapOverlay(cfg);
  var map = new L.Map('map-canvas', {
    center: new L.LatLng(-34.62, -58.42),
    zoom: 11,
    layers: [baseLayer,heatmapLayer]
  });



	var countSvg = dimple.newSvg("#countChartContainer", 386, 210);
	var countChart = new dimple.chart(countSvg);
	countChart.setBounds(30, 30, 340, 160);
	countChart.ease = "quad";
	var x = countChart.addCategoryAxis("x", "Hora");
	var y = countChart.addMeasureAxis("y", "Consultas");
	x.addOrderRule("Hora");
	x.title="";
	y.title="";
	var series=countChart.addSeries(null, dimple.plot.bar);
	series.afterDraw = function (shape, data) {
    var s = d3.select(shape);
    var useDailyData=d3.select("#dayDataCheckbox").node().checked;
		if (data.x==currentTimeOfDay && !useDailyData) {
			s.style('fill', d3.rgb(38, 107, 211));
		} else {
			s.style('fill', d3.rgb(128, 177, 211));
		}
		s.on("click", function () {
			if (data.x!=currentTimeOfDay) {
				generalIndex+=(data.x-currentTimeOfDay);
				update();
		  }
		});
	}


	var addressSvg = dimple.newSvg("#addressChartContainer", 480, 475);
	var addressChart = new dimple.chart(addressSvg);
	addressChart.setBounds(250, 10, 200, 430)
	addressChart.ease = "quad";
	var x1 = addressChart.addMeasureAxis("x", "Consultas");
	x1.tickFormat="d";
  x1.ticks = 5;
	x1.title="";
	var y1 = addressChart.addCategoryAxis("y", "Esquina");
	y1.addOrderRule("Consultas");
	y1.title="";
	var addressSeries=addressChart.addSeries(null, dimple.plot.bar);
  addressSeries.afterDraw = function (shape, data, i) {
    var s = d3.select(shape);
    s.on("click", function () {
      var esquina=addressChart.data.filter(function(value) {return data.y==value.Esquina})[0];
      var marker = L.marker([esquina.lat, esquina.lng ], {
                title: esquina.Esquina,
                riseOnHover: true,
      }).bindPopup(esquina.Esquina);
      map.addLayer(marker);
      marker.openPopup();
      marker.on("click", function(e) {
        map.removeLayer(e.target);
      });

    });
  };



 	var  generalIndex=0;
 	var  currentTimeOfDay=0;


	d3.select("#btnDayAfter").on("click",
		function(d,i){
			generalIndex+=24;
			if (generalIndex>=hourly.length) generalIndex=hourly.length-1;
			update();
		}
	);
	d3.select("#btnDayBefore").on("click",
		function(d,i){
			generalIndex-=24;
			if (generalIndex<0) generalIndex=0;
			update();
		}
	);
	d3.select("#btnHourBefore").on("click",
		function(d,i){
			generalIndex-=1;
			if (generalIndex<0) generalIndex=0;
			update();
		}
	);
	d3.select("#btnHourAfter").on("click",
		function(d,i){
			generalIndex+=1;
			if (generalIndex>=hourly.length) generalIndex=hourly.length-1;
			update();
		}
	);

  d3.select("#dayDataCheckbox").on("click", function () {
    update();
  })

	update = function(){

    d3.select("#date").text(formatDate(getDateFromDayNum(hourly[""+generalIndex].date), 2014));
    d3.select("#time").text(hourly[""+generalIndex].time+":00 hs a "+(hourly[""+generalIndex].time+1)+":00 hs");


    var useDailyData=d3.select("#dayDataCheckbox").node().checked;
    var mapdata=[];
    if (useDailyData) {
      d3.select(".timecontrol").style("visibility","hidden");
      var daydata=[];
      for (j=Math.max(0,generalIndex-24); j<Math.min(hourly.length,generalIndex+24);j++) {
  			if (hourly[""+j].date==hourly[""+generalIndex].date) {
  				mapdata=mapdata.concat(hourly[""+j].data);
  			}
  		}
    } else {
      d3.select(".timecontrol").style("visibility","visible");
      mapdata=hourly[""+generalIndex].data;
    }

    heatmapLayer.setDataFunction({ max: 100, data: mapdata },
    function(d) {
			return {"lat":locations[d[0]][0],"lng":locations[d[0]][1],"count":d[1]};
		});

		currentTimeOfDay=hourly[""+generalIndex].time;

    var dailyFrecuencies=new Array();
    var dailyCorners=new Array();
    for (j=Math.max(0,generalIndex-24); j<Math.min(hourly.length,generalIndex+24);j++) {
			if (hourly[""+j].date==hourly[""+generalIndex].date) {
				dailyFrecuencies.push({"Hora":hourly[""+j].time, "Consultas":hourly[""+j].count});
        if (useDailyData) dailyCorners=dailyCorners.concat(hourly[""+j].data);
			}
		}
		countChart.data=dailyFrecuencies;
	  countChart.draw(200);


    var groupedDailyCorners=_.groupBy(dailyCorners, function (v){ return v[0]});
    var summarizedDailyCorners=_.sortBy(_.pairs(_.mapObject(groupedDailyCorners, function (v, k) {return d3.sum(_.map(v, function(v2) { return v2[1]}))})), function(v3){return -v3[1]});

		var topCount=30;
    var topdata=useDailyData?summarizedDailyCorners.slice(0,topCount):hourly[""+generalIndex].data.slice(0,topCount);

    var top=new Array();
		for (j=0; j<topCount;j++) {
			var data = topdata[j];
			top.push({"Esquina":locations[data[0]][2], "Consultas":data[1], "lat": locations[data[0]][0], "lng": locations[data[0]][1]});
		}
		addressChart.data=top;
		addressChart.draw(500);


	}

	update();

}
