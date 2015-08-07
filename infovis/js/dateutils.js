	var months=["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
	var days=["Sabado", "Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

	var formatDate = function(date){
		return days[date.getDay()]+", "+date.getDate()+" de " + months[date.getMonth()] + " de "+date.getFullYear();
	}

	var getDateFromDayNum = function(dayNum, year){
	    var date = new Date();
	    if(year){
		date.setFullYear(year);
	    }
	    date.setMonth(0);
	    date.setDate(0);
	    var timeOfFirst = date.getTime(); // this is the time in milliseconds of 1/1/YYYY
	    var dayMilli = 1000 * 60 * 60 * 24;
	    var dayNumMilli = dayNum * dayMilli;
	    date.setTime(timeOfFirst + dayNumMilli);
	    return date;
	}	


