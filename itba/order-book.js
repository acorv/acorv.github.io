var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");


var book_tick=.1;

var book_dims = d3.select("#book").node().getBoundingClientRect();
var book_sizeX = book_dims.width;// (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth)-50;
var book_sizeY = book_dims.height;//(window.innerHeight|| document.documentElement.clientHeight || document.body.clientHeight)-50;

var book_margin = {top: 10, right: 10, bottom: 20, left: 40},
    book_width = book_sizeX - book_margin.left - book_margin.right,
    book_height = book_sizeY - book_margin.top - book_margin.bottom;

var book_y = d3.scale.ordinal().rangeBands([book_height,0], .01, .01);
var book_x = d3.scale.linear().rangeRound([0,book_width]);

var book_xAxis = d3.svg.axis().scale(book_x).orient("bottom").ticks(5);
var book_yAxis = d3.svg.axis().scale(book_y).orient("left");

var book_zoom = d3.behavior.zoom().on("zoom", zoomed).center([0,0]);

var book_svg = d3.select("#book").append("svg")
    .attr("width", book_width + book_margin.left + book_margin.right)
    .attr("height", book_height + book_margin.top + book_margin.bottom)
  .append("g")
    .attr("transform", "translate(" + book_margin.left + "," + book_margin.top + ")") ;

var book_zoomLayer=book_svg.append("g");
var book_chartLayer=book_svg.append("g");

book_chartLayer.append("clipPath")
    .attr("id", "book_clip")
  .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", book_width)
    .attr("height", book_height);

book_zoomLayer.append("rect")
    .attr("class", "pane")
    .attr("width", book_width)
    .attr("height", book_height)
    .call(book_zoom);

book_chartLayer.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + book_height + ")");
book_chartLayer.append("g")
    .attr("class", "y axis");

function zoomed() {
  console.log("zoomed")
  book_draw();
}
function book_update() {
  //book_y.domain(d3.range(d3.min(book_data, function(d) { return d.price; }),d3.max(book_data, function(d) { return d.price+book_tick/2; }),book_tick));
  book_y.domain(book_data.map(function(d) { return d.price; }));
  book_x.domain([0, d3.max(book_data, function(d) { return d.total; })]);
  book_zoom.x(book_x);
}

function book_draw() {
    console.log("book_draw");
    if (book_x.domain()[0] < 0) {
      book_zoom.translate([book_zoom.translate()[0] - book_x(0) + book_x.range()[0], book_zoom.translate()[1]]);
    }

    book_chartLayer.select("g.x.axis").call(book_xAxis);
    book_chartLayer.select("g.y.axis").call(book_yAxis);

    book_chartLayer.selectAll(".price").remove();
    book_chartLayer.selectAll(".order").remove();

    var prices = book_chartLayer.selectAll(".prices").data(book_data)
      .enter().append("g")
        .attr("class", "g price")
        .attr("transform", function(d) { return "translate(0," + book_y(d.price) + ")"; });

    var i=0;

    prices.selectAll("rect").data(function(d) { return d.stackedorders; })
      .enter().append("rect")
        .attr("clip-path", "url(#book_clip)")
        .attr("class", "order")
        .attr("height", book_y.rangeBand())
        .attr("x", function(d) { return book_x(d.y0); })
        .attr("width", function(d) { return book_x(d.y1) - book_x(d.y0);})
        .style("fill", function(d) {
          if (d.side=='bid') {
            return (i++%2)?"#FFCC00":"#FF9900";
          } else {
            return (i++%2)?"steelblue":"#91c3dc"
          }}
        )
        //.style("stroke", i++%2==0?"steelblue":"green")
        .on("mouseover", function(d){
          tooltip.html("Pos #"+d.position+"<br>Id:"+d.id+"<br>Account:"+d.account+"<br>Size:"+d.size);
          return tooltip.style("visibility", "visible");})
        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-20)+"px").style("left",(d3.event.pageX-120)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
        .call(book_zoom);
}
