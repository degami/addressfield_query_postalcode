(function($){
	var request = null;
	var timer = null;

	function setAdvancedTimer(f, delay) {
		var obj = {
			firetime: delay + (+new Date()), // the extra + turns the date into an int
			called: false,
			canceled: false,
			callback: f
		};
		// this function will set obj.called, and then call the function whenever
		// the timeout eventually fires.
		var callfunc = function() { obj.called = true; obj.callback(); };
		// calling .extend(1000) will add 1000ms to the time and reset the timeout.
		// also, calling .extend(-1000) will remove 1000ms, setting timer to 0ms if needed
		obj.extend = function(ms) {
			// break early if it already fired
			if (obj.called || obj.canceled) return false;
			// clear old timer, calculate new timer
			clearTimeout(obj.timeout);
			obj.firetime += ms;
			var newDelay = obj.firetime - new Date(); // figure out new ms
			if (newDelay < 0) newDelay = 0;
			obj.timeout = setTimeout(callfunc, newDelay);
			return obj;
		};
		// Cancel the timer...
		obj.cancel = function() {
			obj.canceled = true;
			clearTimeout(obj.timeout);
		};
		// Update callback
		obj.updF = function(f) {
			obj.called = obj.canceled = false;
			obj.callback = f;
			clearTimeout(obj.timeout);
			var newDelay = obj.firetime - new Date(); // figure out new ms
			if (newDelay < 0) newDelay = 0;
			obj.timeout = setTimeout(callfunc, newDelay);
			return obj;
		};
		// Restart the timer...
		obj.restartDelay = function(delay){
			// clear old timer, calculate new timer
			obj.called = obj.canceled = false;
			clearTimeout(obj.timeout);
			obj.firetime = delay + (+new Date()); // the extra + turns the date into an int
			var newDelay = obj.firetime - new Date(); // figure out new ms
			if (newDelay < 0) newDelay = 0;
			obj.timeout = setTimeout(callfunc, newDelay);
			return obj;
		}
		// call the initial timer...
		obj.timeout = setTimeout(callfunc, delay);
		// return our object with the helper functions....
		return obj;
	}

	$(document).ready(function(){

		Drupal.behaviors.queryPostal = {
		  attach: function (context, settings) {

		  	//$( '.state, .locality, .postal-code', context ).val('');

		  	$( '.postal-code', context ).keypress(function(){
		  		var $this = $(this) ;
		  		var $context = $this.closest("fieldset");
		  		$( '.locality, .state', $context ).val('');
		  	});

		  	$( '.locality', context ).keyup(function(){
		  		var $this = $(this) ;
		  		var $context = $this.closest("fieldset");
		  		if($this.attr('value') == ''){
		  			$( '.postal-code, .state', $context ).val('');
		  		}
		  	});

			$( 'input[type=text].state, input[type=text].locality, input[type=text].postal-code' ).once('queryPostalKeyup').keyup(function(evt){
				$this = $(this); //console.log($this.val());
				$.data($this,'eventTriggering','keyup');

				//if( $.trim($this.val()).length > 2 ) {
				if( $.trim( $this.attr('value') ).length > 2 ) { // attr è + aggiornato
					$this.trigger('change');
				}
				evt.stopPropagation();
			});

			$( '.country, .state, .locality, .postal-code' ).once('queryPostalChange').change(function(evt){
		  	//$( '.country, .state, .locality, .postal-code' ).once('queryPostal').keypress(function(){
		  		//if( $.trim($this.val().length) < 3 ) return;
		  		$this = $(this);
		  		$.data($this,'eventTriggering','change');
				//console.log($this); //console.log($.data($this,'eventTriggering'));

		  		$context = $this.closest("fieldset");

		  		$ul = $(this).parent().find('ul.ul-dropdown');
		  		if( $ul.length > 0 ){
					$ul.fadeOut(100 , function (){
						$(this).find('li').remove();
					});		  			
		  		}

		  		//if( $.trim($this.val()) == '') return;
				if( $.trim($this.attr('value')) == '') return; // attr è + aggiornato

		  		var elements = {}
				$(['country','state','locality','postal-code'], $context).each(function(index,elem){
					//elements[elem.replace('-','_')] = $('.'+elem,$context).val();
					var value = $('.'+elem,$context).attr('value') != undefined ? $('.'+elem,$context).attr('value') : $('.'+elem,$context).val();
					elements[elem.replace('-','_')] = value;
				});

				if( request != null ) request.abort();
				if(timer == null){
					timer = setAdvancedTimer(function() {
						request = doTheQueryRequest(elements);
					}, 500);
				}else{
					timer.updF(function(){
						request = doTheQueryRequest(elements);
					}).restartDelay(500);
				}
				evt.stopPropagation();
		  	});

		  }
		};
		Drupal.behaviors.queryPostal.attach();
	});

	var doTheQueryRequest = function(queryelements){
		var request = $.post("/query_postal",{
			data: JSON.stringify({
		            elements: queryelements
		    }),
		})
		 .done(function(data) {
			var states = [];
			var cities = [];
			var codes = [];
				var stateoptions = [];

				$('.state option').each(function(){
					if ( $(this).attr('value').length > 0 ) {
						stateoptions.push($(this).attr('value'));
					}
			});

			$(data.result).each(function (index, elem){
				// country_code
				// postal_code
				// place_name
				// admin_name1
				// admin_code1
				// admin_name2
				// admin_code2
				// admin_name3
				// admin_code3
				// latitude
				// longitude
				// accuracy 
				
				if( $.inArray(elem.postal_code, codes) == -1 ){
					codes.push(elem.postal_code);
				}

				if( $.inArray(elem.place_name, cities) == -1 ){
						cities.push(elem.place_name);
				}

					if( $.inArray(elem.admin_code1, stateoptions) > -1 ){
						if( $.inArray(elem.admin_code1+'|'+elem.admin_name1, states) == -1 )
  						states.push(elem.admin_code1+'|'+elem.admin_name1);
					}else if( $.inArray(elem.admin_code2, stateoptions) > -1 ){
						if( $.inArray(elem.admin_code2+'|'+elem.admin_name2, states) == -1 )
							states.push(elem.admin_code2+'|'+elem.admin_name2);
					}
			});

			$(['state','locality','postal-code']).each(function(index,elem){
				var array = [];
				if(elem == 'state'){
					array = states;
				}else if(elem == 'locality'){
					array = cities;
				}else if(elem == 'postal-code'){
					array = codes;
				}

				for(var i = 0;i<array.length; i++){
					var value = array[i];
					if( value.indexOf('|') != -1 ) {
						array[i] = value.substr( 0,value.indexOf('|') );
					}
				}

				//console.log( $.trim(data.query[elem.replace('-','_')]) , array , $.inArray( $.trim(data.query[elem.replace('-','_')]) , array ) )

				if( $.trim( data.query[elem.replace('-','_')] ) == '' ||  $.inArray( $.trim(data.query[elem.replace('-','_')]) , array ) == -1 ){
					var value='';
					if( elem == 'state' ){
						$('.'+elem,$context).postalDropdown(states);
					}else if( elem == 'locality' ){
						$('.'+elem,$context).postalDropdown(cities);
					}else if( elem == 'postal-code' ){
						$('.'+elem,$context).postalDropdown(codes);
					}
					//$('.'+elem,context).val(value);
				}
			});

		 	//var elements  = data.elements;
			//alert( "success" );
		})
		.fail(function(data) {
			//console.log(data);
			//alert( "error" );
		})
		.always(function(data) {
			//console.log(data);
			//alert( "complete" );
		});
		return request;
	}

	//$ul.fadeIn(100);

/*
	$.fn.postalDropdown = function(elements) {
		var $element = this;
		console.log(elements);console.log($element)
		var pos = $element.offset();
		pos.top += $element.width();
		var ulid = "ul-dropdown-"+$element.attr('id');
		if( $('#'+ulid).length == 0 ){
			$('<ul />').attr('id',ulid).addClass('ul-dropdown').appendTo($element.parent());
		}
		var $ul = $('#'+ulid);
		$ul.position(pos);
		$ul.find('li').remove();
		$(elements).each(function(index,elem){
			var value = elem;
			if( value.indexOf('|') != -1 ) {
				value = value.substr( 0,value.indexOf('|') );
				elem = elem.substr( elem.indexOf('|')+1 );
			}
			var $li = $('<li />').text(elem).attr('data-attr-value',value).click( function(evt){
				$element.val( $(this).attr('data-attr-value') );
				$(this).parent().fadeOut(100 , function (){
					$(this).find('li').remove();
				});
				return false;
			}).appendTo($ul);
		});
		if($ul.find('li').length > 0 )
			$ul.fadeIn(100);
	} 
*/
	// $.fn.greenify = function() {
	// 	this.css( "color", "green" );
	// };
	// $( "a" ).greenify(); // Makes all the links green.	


	// first we set up our constructor function
	var postalDropdown = function(elements, subjects, options){
	  this.elements = elements;
	  this.subjects = $(subjects).sort(sortAlpha);

	  this.options = $.extend({}, this.defaults, options);
	  this.attach();
	}; 

	function sortAlpha(a,b){  
		if(a.toLowerCase() == b.toLowerCase()) return 0;
	    return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
	};

	postalDropdown.prototype = {
	  // now we define the prototype for postalDropdown
	  	defaults: {},

		attach: function(){
			var self = this;
			this.elements.each(function(index, element){

				var $element = $(element);

				//if( $.trim($element.val()).length > 0 && $.inArray( $element.val(),self.subjectsVals() ) != -1 ) return; // ho già un valore? esco
				if( $.trim($element.attr('value')).length > 0 && $.inArray( $element.attr('value'),self.subjectsVals() ) != -1 ) return; // attr è + aggiornato

				var pos = $element.offset();
				pos.top += $element.width();
				var ulid = "ul-dropdown-"+$element.attr('id');
				
				//console.log(ulid);

				if( $('#'+ulid).length == 0 ){
					$('<ul />').attr('id',ulid).addClass('ul-dropdown').appendTo($element.parent());
				}
				
				var $ul = $('#'+ulid);
				$ul.css({ width: $element.outerWidth() - 2 });
				$ul.position(pos);
				//console.log($ul, 'li presenti: '+$ul.find('li').length , $ul.find('li'));
				$ul.find('li').remove();
				//console.log( 'li presenti: '+$ul.find('li').length , $ul.find('li'), self.subjects);

				$(self.subjects).each(function(index,elem){
					var value = elem;
					if( value.indexOf('|') != -1 ) {
						value = value.substr( 0,value.indexOf('|') );
						elem = elem.substr( elem.indexOf('|')+1 );
					}
					var $li = $('<li />').text(elem).attr('data-attr-value',value).click( function(evt){
						$element.val( $(this).attr('data-attr-value') );
						self.removeDropdown();

						// console.log( $element , $.data($element,'eventTriggering') );

						if( $.data($element,'eventTriggering') != 'change' )
							$element.trigger('change');
						
						$.data($element,'eventTriggering',null);
						return false;
					}).appendTo($ul);
				});
				
				if($ul.find('li').length > 0 ){
					$ul.fadeIn(100);
					if( $ul.find('li').length == 1 ){
						$ul.find('li:eq(0)').click();
					}
				}else{
					$ul.hide();
				}
			});
		},

		hasDropdown: function(){
			return (this.elements.parent().find('ul.ul-dropdown').length > 0);
		},

		removeDropdown: function(){
			this.elements.parent().find('ul.ul-dropdown').fadeOut(100 , function (){
				$(this).find('li').remove();
			});
		},

		subjectsVals: function(){
			var out = [];
			$(self.subjects).each(function(index,elem){
				var value = elem;
				if( value.indexOf('|') != -1 ) {
					value = value.substr( 0,value.indexOf('|') );
				}
				out.push(value);
			});
			return out;
		}

	};

	// does nothing more than extend jQuery
	$.fn.postalDropdown = function(subjects, options){
	  new postalDropdown(this, $(subjects), options)
	  return this;
	};


})(jQuery);