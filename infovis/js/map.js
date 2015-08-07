window.onload = function() {
	d3.select(".loading").style("display","none");
	d3.select(".wrapper").style("display","block");

        var baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
            attribution: '',
            maxZoom: 18
          }
        );
        var cfg = {
          // radius should be small ONLY if scaleRadius is true (or small radius is intended)
          "radius": 0.005,
          "maxOpacity": .8, 
          // scales the radius based on map zoom
          "scaleRadius": true, 
          // if set to false the heatmap uses the global maximum for colorization
          // if activated: uses the data maximum within the current map boundaries 
          //   (there will always be a red spot with useLocalExtremas true)
          "useLocalExtrema": false,
          // which field name in your data represents the latitude - default "lat"
          latField: 'lat',
          // which field name in your data represents the longitude - default "lng"
          lngField: 'lng',
          // which field name in your data represents the data value - default "value"
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
		if (data.x==currentTimeOfDay) {
			s.style('fill', d3.rgb(38, 107, 211));
		} else {
			s.style('fill', d3.rgb(128, 177, 211));
		}
	}


	var addressSvg = dimple.newSvg("#addressChartContainer", 480, 500);
	var addressChart = new dimple.chart(addressSvg);
	addressChart.setBounds(250, 10, 200, 450)
	addressChart.ease = "quad";
	var x1 = addressChart.addMeasureAxis("x", "Consultas");
	x1.tickFormat="d";
	x1.title="";
	var y1 = addressChart.addCategoryAxis("y", "Esquina");
	y1.addOrderRule("Consultas");
	y1.title="";
	addressChart.addSeries(null, dimple.plot.bar);	


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


	update = function(){

   		heatmapLayer.setDataFunction({ max: 100, data: hourly[""+generalIndex].data }, function(d) { 
			return {"lat":locations[d[0]][0],"lng":locations[d[0]][1],"count":d[1]};
		});

		d3.select("#date").text(formatDate(getDateFromDayNum(hourly[""+generalIndex].date), 2014));
		d3.select("#time").text(hourly[""+generalIndex].time+":00 hs a "+(hourly[""+generalIndex].time+1)+":00 hs");

		currentTimeOfDay=hourly[""+generalIndex].time;

		var topCount=30;
		var topdata=hourly[""+generalIndex].data.slice(0,topCount);
		var top=new Array();
		for (j=0; j<topCount;j++) {
			var data = topdata[j];
			top.push({"Esquina":locations[data[0]][2], "Consultas":data[1]});			
		}
		addressChart.data=top;
		addressChart.draw(500);


		var frecuencies=new Array();
		for (j=Math.max(0,generalIndex-24); j<Math.min(hourly.length,generalIndex+24);j++) {
			if (hourly[""+j].date==hourly[""+generalIndex].date) {
				frecuencies.push({"Hora":hourly[""+j].time, "Consultas":hourly[""+j].count});			
			}
		}
		countChart.data=frecuencies;
	        countChart.draw(200);
	}

	update();

  }


