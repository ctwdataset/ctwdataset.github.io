;(function() {
	'use strict';
	var resources = [
		['ctwjs', 'js/Chart.min.js'],
		['ctwcss', 'css/bootstrap.min.css'],
	];
	function draw() {
		var data = JSON.parse(document.getElementById('data-wrap').innerHTML);
		var bodyInner = '<div class="container">'
			+ '	<h2 class="text-center">Detailed results</h2>'
			+ '	<div class="row">'
			+ '		<div class="col-md-12"><h3 class="text-center" id="top-1-accuracy">Top-1 accuracy = %</h3></div>'
			+ '	</div>'
			+ '	<div class="row">'
			+ '		<div class="col-md-6">'
			+ '			<h4 class="text-center">Top-1 accuracy with each attribute</h4>'
			+ '			<canvas id="recall-with" width="500" height="500" style="margin: auto;"></canvas>'
			+ '		</div>'
			+ '		<div class="col-md-6">'
			+ '			<h4 class="text-center">Top-1 accuracy without each attribute</h4>'
			+ '			<canvas id="recall-without" width="500" height="500" style="margin: auto;"></canvas>'
			+ '		</div>'
			+ '	</div>'
			+ '	<div class="row">'
			+ '		<div class="col-md-12">'
			+ '			<h4 class="text-center">Top-1 accuracy (%) with each attribute combination and each size</h4>'
			+ '			<table class="table table-striped table-hover table-sm text-right">'
			+ '				<thead>'
			+ '					<tr id="combine-thead-tr"></tr>'
			+ '					<tr id="combine-thead-tr-line2"></tr>'
			+ '				</thead>'
			+ '				<tbody id="combine-tbody"></tbody>'
			+ '			</table>'
			+ '		</div>'
			+ '	</div>'
			+ '	<div class="row" style="height: 100px;"></div>'
			+ '</div>';
		document.body.innerHTML = bodyInner;
		var szColor = (function() {
			var map = {
				all: 'rgba(31,119,180,',
				large: 'rgba(255,127,14,',
				medium: 'rgba(44,160,44,',
				small: 'rgba(214,39,40,',
			};
			var defaultColor = 'rgba(128,128,128,';
			return function(szname, a=1.) {
				return (map[szname] || defaultColor) + a + ')';
			}
		})();
		var Top1AccuracyTag = document.getElementById('top-1-accuracy');
		Top1AccuracyTag.style.color = szColor('all');
		['with', 'without'].forEach(function(withStr) {
			return new Chart(document.getElementById('recall-' + withStr), {
				type: 'radar',
				data: {
					labels: ['all'].concat(data.attributes),
					datasets: data.size_ranges.map(function(szrange) {
						var szname = szrange[0];
						return {
							label: szname,
							data: ['__all__'].concat(data.attributes).map(function(attr) {
								var attrId = data.attributes.indexOf(attr);
								var attrPerf = data.performance[szname].attributes;
								var n = 0, rc = 0;
								attrPerf.forEach(function(perf, i) {
									if (attrId == -1 || (withStr == 'with' ? i & 1 << attrId : 0 == (i & 1 << attrId))) {
										n += perf.n;
										rc += perf.recalls['1'];
									}
								});
								if (szname == 'all' && attr == '__all__')
									Top1AccuracyTag.textContent = 'Top-1 accuracy = ' + (100. * rc / n).toFixed(2) + '%';
								return 0 < n ? parseFloat((100. * rc / n).toFixed(4)) : 0;
							}),
							fill: szname == 'all',
							backgroundColor: szColor(szname, .2),
							borderColor: szColor(szname),
							pointHitRadius: 10,
							pointBackgroundColor: szColor(szname, .2),
							pointBorderColor: szColor(szname),
						};
					}),
				},
				options: {
					responsive: false,
					scale: {
						ticks: {
							min: 0,
							max: 100,
							stepSize: 20,
						},
					},
				},
			});
		});
		var conbimeTr = document.getElementById('combine-thead-tr');
		var conbimeTrLine2 = document.getElementById('combine-thead-tr-line2');
		data.attributes.forEach(function(attr) {
			var th = document.createElement('th');
			th.setAttribute('rowspan', 2);
			th.textContent = attr + '?';
			conbimeTr.appendChild(th);
		});
		data.size_ranges.forEach(function(szrange) {
			var szname = szrange[0];
			var th = document.createElement('th');
			th.style.color = szColor(szname);
			th.setAttribute('colspan', 2);
			th.textContent = szname;
			conbimeTr.appendChild(th);
			th = document.createElement('th');
			th.style.color = szColor(szname);
			th.textContent = 'n';
			conbimeTrLine2.appendChild(th);
			th = document.createElement('th');
			th.style.color = szColor(szname);
			th.textContent = 'acc.';
			conbimeTrLine2.appendChild(th);
		});
		Array.apply(null, Array(1 << data.attributes.length)).forEach(function(_, k) {
			var tr = document.createElement('tr');
			data.attributes.forEach(function(attr, i) {
				var td = document.createElement('td');
				td.textContent = k & 1 << i ? attr : '~' + attr;
				tr.appendChild(td);
			});
			data.size_ranges.forEach(function(szrange) {
				var szname = szrange[0];
				var perf = data.performance[szname].attributes[k];
				var td = document.createElement('td');
				td.style.color = szColor(szname);
				td.textContent = perf.n;
				tr.appendChild(td);
				td = document.createElement('td');
				td.style.color = szColor(szname);
				td.textContent = 0 < perf.n ? (100. * perf.recalls['1'] / perf.n).toFixed(2) : '';
				tr.appendChild(td);
			});
			document.getElementById('combine-tbody').appendChild(tr);
		});
	}

	var ctwjspath = document.getElementById('ctwjs').src.split('?')[0];
	var len = ctwjspath.length - 1;
	while (len >= 0 && ctwjspath[len] != '/' && ctwjspath[len] != '\\')
		len--;
	var ctwroot = ctwjspath.substr(0, len + 1);
	var isLoaded = resources.map(function() { return false; });
	function documentOnLoad(func) {
		if (document.readyState != 'loading' || document.addEventListener === undefined)
			func();
		else
			document.addEventListener('DOMContentLoaded', func);
	}
	function getOnLoad(res_id) {
		return (function() {
			isLoaded[res_id] = true;
			var allLoaded = true;
			isLoaded.forEach(function(thisLoaded) { allLoaded = allLoaded && thisLoaded; });
			if (isLoaded.every(function(x) { return x; })) {
				documentOnLoad(draw);
			}
		});
	}
	function getOnError(res_id) {
		return (function onError(error) {
			var p = document.createElement('p');
			p.textContent = 'Error occurred on loading resource: ' + resources[res_id][1];
			documentOnLoad(function() { document.body.appendChild(p); });
			throw error;
		});
	}
	if (0 == resources.length)
		documentOnLoad(draw);
	resources.forEach(function(resource, res_id) {
		var tag;
		if (resource[0] == 'js') {
			tag = document.createElement('script');
			tag.setAttribute('src', resource[1]);
			tag.setAttribute('async', 'async');
		} else if (resource[0] == 'ctwjs') {
			tag = document.createElement('script');
			tag.setAttribute('src', ctwroot + resource[1]);
			tag.setAttribute('async', 'async');
		} else if (resource[0] == 'css') {
			tag = document.createElement('link');
			tag.setAttribute('rel', 'stylesheet');
			tag.setAttribute('href', resource[1]);
		} else if (resource[0] == 'ctwcss') {
			tag = document.createElement('link');
			tag.setAttribute('rel', 'stylesheet');
			tag.setAttribute('href', ctwroot + resource[1]);
		} else {
			console.error(false, 'unknown resource type `' + resource[0] + '`');
		}
		tag.addEventListener('load', getOnLoad(res_id));
		tag.addEventListener('error', getOnError(res_id));
		document.head.appendChild(tag);
	});
})();
