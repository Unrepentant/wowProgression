/*! WoW Progression v1.5.0
	by Rob G (Mottie)
	https://github.com/Mottie/wowProgression
	http://www.opensource.org/licenses/mit-license.php
	Usage:
	$('.progression1').wowProgression({
		region : "us",
		locale : "en_US",
		server : "Lightning's Blade",
		guild  : "Our Guild's Name",
		raiders: { all: ['raider1', 'raider2'] }
	});
*/
/*jshint jquery:true */
/*global console:false */
;(function($){
	"use strict";
	$.fn.wowProgression = function(options){
		return this.each(function(){
			// don't allow multiple instances
			if (this.initialized) { return; }
			var el = this,
			o = $.extend({
				// ** Guild Info ***
				// battlenet domain - "us", "eu", "kr", "tw" or "sea"; use "cn" for china
				region  : 'us',
				// locale - "en_US", "es_MX", "pt_BR", "en_GB", "es_ES", "fr_FR",
				// "ru_RU", "de_DE", "pt_PT", "it_IT", "ko_KR", "zh_TW" or "zh_CN"
				locale  : 'en_US',
				// game server name; include spaces and apostrophes
				server  : "Lightning's Blade",
				// guild name; include spaces and apostrophes
				guild   : "Our Guild's Name",
				// list raiders here under "all" or the expansion abbreviation
				// raiders : { all : ['raider1', 'raider2'], 'mists' : [ 'raider3' ], 'cat' : [ 'raider3alt' ] }
				raiders : {},

				// ** Appearance **
				// expansion to show. The order can be changed
				// use "mists" and/or "cat"
				show    : ['mists'],
				// show flex?
				flex    : true,
				// show heroics?
				heroics : true,
				// 75% of raiders showing kill before boss counted as killed
				ratio   : 0.75,
				// instance boss count (inside progress bar)
				// {n} = number kill count, {t} = total, {p} = percentage
				count   : '{p}',
				// boss killed text/count (inside tooltip)
				// use {s} for none/killed status text, {n} for number of kills (avg), or both
				status  : '{s}',
				// use instance abbreviation
				useAbbr : false,
				// boss status text
				text    : {
					zero    : '',  // boss kill count (if zero)
					none    : '',  // boss not killed text
					killed  : 'Killed' // boss killed text
				},
				// tooltip class name added to instance block
				tooltip : "tooltip",
				// list of recent expansions
				allexps : {
					"mists"   : "Mists of Pandaria",
					"cat"     : "Catacylsm"
				},
				/***
				list of all raids in each expansion, with abbreviations & boss icons
				get the id and icon numbers from wowhead, e.g.
					Siege of Orgrimmar: http://www.wowhead.com/zone=6738 <- 6738 is the instance ID
					Immerseus: http://www.wowhead.com/npc=71543 <- 71543 is the boss id/icon number (first boss)
				if the raid doesn't show up, it might not be available from the battlenet feed:
					http://us.battle.net/api/wow/character/{server}/{character}?locale=en_US&fields=progression
				load the above feed replacing the {server}/{character} with appropriate names,
				then CTRL-F to find the instance name & see if it exists
				***/
				allraids: {
					"mists": [
					{ abbr: "SoO",  hasHeroic: true, id: 6738, icons: [71543,71475,71965,71734,72249,72616,71859,71515,71454,71889,71529,71504,71152,71865] },
					{ abbr: "ToT",  hasHeroic: true, id: 6622, icons: [69465,68476,69078,67977,68066,68177,67827,69017,69427,68078,68904,68397,69473], heroicBoss: true },
					{ abbr: "ToES", hasHeroic: true, id: 6067, icons: [60583,62442,62983,60999] },
					{ abbr: "HoF",  hasHeroic: true, id: 6297, icons: [62980,62543,62164,62397,62511,62837] },
					{ abbr: "MV",   hasHeroic: true, id: 6125, icons: [60051,60009,60143,60701,60410,60396] }
					],
					"cat": [
					{ abbr: "DS",   hasHeroic: true, id: 5892, icons: [55265,55308,55312,55689,55294,56427,53879,57962] },
					{ abbr: "FL",   hasHeroic: true, id: 5723, icons: [52498,52558,53691,52530,53494,52571,52409] },
					{ abbr: "ToFW", hasHeroic: true, id: 5638, icons: [45871,46753] },
					// heroicBoss was added as a hack to make the last boss in the instance only show up in heroic mode; in this case it's Sinestra
					// otherwise we'd have two separate "icons" arrays, one for normal and the other for heroic (lots of duplication)
					{ abbr: "BoT",  hasHeroic: true, id: 5334, icons: [44600,45993,43687,43324,45213], heroicBoss: true },
					{ abbr: "BD",   hasHeroic: true, id: 5094, icons: [42179,41570,41442,43296,41378,41376] },
					{ abbr: "BH",   hasHeroic: false,id: 5600, icons: [47120,52363,55869] }
					]
				},

				// ** Callbacks **
				// initialized callback function
				initialized: null,

				// ** Debugging **
				// set to true to show all raider information (for debugging)
				details : false,
				// click to show details
				clickForDetails : true,
				// grouping of details
				grouping: 4,
				// output to console
				debug : false

			}, options),

			// blizzard api: http://blizzard.github.com/api-wow-docs/#features/access-and-regions
			api = "http://" + (o.region === "cn" ? "www.battlenet.com.cn" : o.region + ".battle.net") + "/api/wow/character/" + o.server + "/",

			// boss icon root
			iconroot = "http://media.blizzard.com/wow/renders/npcs/portrait/creature", // + ".jpg"

			raids = [],
			expansion = {},
			raiders = [],
			t, results,
			hasInitialized = false,

			output = {},
			log = function(txt){
				if (console && console.log) {
					console.log(txt);
				}
			},

			getWoWJSON = function(name){
				return jQuery.getJSON(api + name + "?locale=" + o.locale + "&fields=progression&jsonp=?", function(data){
					if (data && data.progression) {
						var name = data.name.toLocaleLowerCase();
						raiders.push(name);
						raids.push(data.progression.raids);
						if (o.debug) { log([ name, 'URL: ' + api + name + "?locale=" + o.locale + "&fields=progression", data ]); }
					}
				});
			},

			getRaiders = function(){
				var r, expan, i, j, k, list = [], raiderz = [];
				for (expan in o.raiders) {
					if ((o.raiders).hasOwnProperty(expan)) {
						if (expan === 'all' || $.inArray(expan, o.show) >= 0) {
							r = o.raiders[expan];
							for (j = 0; j < r.length; j++) {
								// ignore empty strings
								if (r[j] !== '') {
									// overall list of raiders
									list.push(r[j]);
									// add raider to specific expansion
									if (expan === "all") {
										for (k = 0; k < o.show.length; k++) {
											if (!expansion[o.show[k]]) { expansion[o.show[k]] = []; }
											expansion[o.show[k]].push(r[j]);
										}
									} else {
										if (!expansion[expan]) { expansion[expan] = []; }
										expansion[expan].push(r[j]);
									}
								}
							}
							if (o.debug) { log('Expansion (' + expan + ') raiders: ' + r ); }
						}
					}
				}
				// get unique list of raiders for loading
				list = $.grep(list, function(v, k){
					return $.inArray(v, list) === k;
				});
				for (i = 0; i < list.length; i++) {
					if (list[i]) {
						list[i] = list[i].toLocaleLowerCase(); // ignore case
						raiderz.push( getWoWJSON(list[i]) );
					}
				}
				return raiderz;
			},

			fixQuotes = function(txt){
				return txt.replace(/'/g,"\'").replace(/"/g, '&quot;');
			},

			fixHtml = function(txt){
				return txt.replace(/[<>]/g, function(m){
					return {
						'<': '&lt;',
						'>': '&gt;'
					}[m];
				});
			},

			buildTooltip = function(mode, name, icon, d, len, outpt){
				var killed = d.counts[mode]/len >= o.ratio,
					// [mode] status : '{s}' for killed text; '{n}' for number of kills
				c = fixQuotes(o.status).replace(/\{(s|n)\}/g, function(m){
					return {
						'{s}': killed ? fixQuotes(o.text.killed) : fixQuotes(o.text.none),
						'{n}': d.totals[mode]/len < o.ratio ? fixQuotes(o.text.zero) : Math.ceil(d.totals[mode]/len) // avg number of total kills
					}[m];
				}),

				tt = "<div class='boss " + (killed ? "boss-killed" : "") + "'>" +
					"<img class='boss-icon' src='" + iconroot + icon + ".jpg'>" +
					"<span class='boss-name'>" + fixQuotes(name) + "</span>" +
					"<span class='boss-status'>" + c + "</span></div>";
				if (o.debug) {
					outpt[name] = 'ratio: ' + (d.counts[mode]/len) + ', ' + mode + ': ' + (d.counts[mode]/len >= o.ratio ? '+' : '-') + ', ';
				}
				return tt;
			},

			addDetails = function(mode, d, p) {
				var tt = "<div class=inst><div class=inst-title>" + mode + " <span class=inst-count>" +
					d.kills[mode] + "/" + d.bosses[mode] + " (" + p + ")</span></div></div>" + d.tips[mode];
				// add details
				tt += "<div class=details" + (o.details ? "" : " style='display:none'") +
					"><hr><table><tr><td>Raider</td><td class=mono>" + d.detailsIndex[mode].join('') + "</td></tr>";
				$.each(d.details[mode], function(i,v){
					if (v) {
						tt += "<tr><td>" + v.shift() + "</td><td class=mono>" + v.join('') + "</td></tr>";
					}
				});
				tt += '</table></div>';
				return '<div class=tips>' + tt + '</div>';
			},

			buildProgressBar = function(mode, d){
				var p = Math.round(d.kills[mode]/d.bosses[mode] * 100) + '%', // % killed
				// output format: {n}/{t} or {p}
				c = o.count.replace(/\{[n|p|t]\}/g, function(m){ return {
						'{p}': p,
						'{n}': d.kills[mode],
						'{t}': d.bosses[mode]
					}[m];
				});
				return '<div class="bar-bkgd bar-' + mode + ' ' + o.tooltip + '" title="' + fixHtml(addDetails(mode, d, p)) + '">' +
					'<div class="bar-color" style="width: ' + p + ';"><span class="bar-text">' + c + '</span></div>' +
					'</div>';
			},

			calcKill = function(mode, d, boss, index, len){
				var k = boss[mode + 'Kills'],
					group = '<span class=group' + Math.floor(len/o.grouping) + '>';
				// calculate boss kills
				if (k > 0) {
					d.details[mode][index].push(group + '+' + '</span>');
					d.counts[mode]++;
					d.totals[mode] += k;
				} else {
					d.details[mode][index].push(group + '-' + '</span>');
				}
			},

			processRaids = function(){
				// Don't let this run twice, if it initialized successfully!
				if (hasInitialized) { return; }
				var i, j, k, l, m, n, x, z, nhb, bt,
				inst, instances, boss, exp, len,
				t = '',
				// varible used to calculate boss kills, it is cleared after each instance
				d = {
					hasFlex: '', // has flex bosses (start with empty string)
					tips   : {}, // tooltips
					counts : {}, // number of raiders that have killed the boss
					bosses : {}, // number of bosses per instance
					kills  : {}, // actual boss kills (calculated using ratio)
					totals : {}, // total boss kills of all raiders (gets averaged)
					details: {}, // +/- in details
					detailsIndex : {} // boss count in details section
				};

				// loop through expansions
				for (i = 0; i < o.show.length; i++) {
					/*jshint loopfunc: true */
					exp = o.show[i];
					output[exp] = {};
					instances = o.allraids[exp];
					// number of raiders for the current expansion
					len = expansion[exp].length;
					t += '<h3 class="expansion expansion-' + exp + '">' + o.allexps[exp] + '</h3><div class="instances instances-' + exp + '">';
					// loop throught instances
					for (j = 0; j < instances.length; j++) {
						// find instance in raider list
						if (raids[0]) {
							for (k = 0; k < raids[0].length; k++) {
								inst = raids[0][k] || null;
								if (inst && inst.id === instances[j].id) {
									instances[j].name = inst.name;
									output[exp][inst.name] = {};
									boss = inst.bosses;
									bt = boss.length;

									// reset values
									d.tips = { flex: '', normal: '', heroic: '' };
									d.details = { flex: [], normal: [], heroic: [] };
									d.detailsIndex = { flex: [], normal: [], heroic: [] };
									d.bosses = { flex: bt, normal: bt, heroic: bt };
									d.kills = { flex: 0, normal: 0, heroic: 0 };
									d.hasFlex = '';

									// find instance boss kill counts
									for (l = 0; l < bt; l++) {

										// Check for instance icon, if it doesn't exist, don't add it (removes Ragnaros repeat)
										if (instances[j].icons[l]) {
											// add group class name to each group of boss details
											z = '<span class=group' + Math.floor(l/o.grouping) + '>' + (l+1)%10 + '</span>';
											// no heroic boss?
											nhb = !instances[j].heroicBoss || ( instances[j].heroicBoss && l < inst.bosses.length - 1 );

											if (nhb) {
												// details (normal) boss # in header
												d.detailsIndex.normal.push(z);
												d.detailsIndex.flex.push(z);
											}
											d.detailsIndex.heroic.push(z);

											d.counts = { flex: 0, normal: 0, heroic: 0 };
											d.totals = { flex: 0, normal: 0, heroic: 0 };

											// check other raiders
											for (m = 0; m < len; m++){
												// check that the raider is listed in the current expansion
												x = expansion[exp][m];
												n = $.inArray( (x || '').toLocaleLowerCase(), raiders );
												if (n >= 0) {
													// add raider names to detailed report
													if (!d.details.flex[m]) { d.details.flex[m] = [x]; }
													if (!d.details.normal[m]) { d.details.normal[m] = [x]; }
													if (!d.details.heroic[m]) { d.details.heroic[m] = [x]; }

													// has flex mode?
													if (d.hasFlex === '') {
														d.hasFlex = !!raids[n][k].bosses[l].flexKills;
													}

													// don't count the heroic only boss (only the last boss is skipped)
													if (nhb) {
														if (d.hasFlex) {
															calcKill('flex', d, raids[n][k].bosses[l], m, l);
														}
														calcKill('normal', d, raids[n][k].bosses[l], m, l);
													}
													calcKill('heroic', d, raids[n][k].bosses[l], m, l);
												}
											}

											// update boss kill count
											if (d.hasFlex && d.counts.flex/len >= o.ratio) { d.kills.flex++; }
											if (d.counts.normal/len >= o.ratio) { d.kills.normal++; }
											if (d.counts.heroic/len >= o.ratio) { d.kills.heroic++; }

											if (instances[j].heroicBoss && l === inst.bosses.length - 1) {
												// skip Sinestra in BoT & Ra-den in ToT in normal and flex mode
												// adjust boss count of instance
												d.bosses.flex--;
												d.bosses.normal--;
											} else {
												d.tips.normal += buildTooltip('normal', boss[l].name, instances[j].icons[l], d, len, output[exp][inst.name]);

												// include flex?
												if (d.hasFlex && o.flex) {
													d.tips.flex += buildTooltip('flex', boss[l].name, instances[j].icons[l], d, len, output[exp][inst.name]);
												}
												// include heroics?
												if (o.heroics) {
													d.tips.heroic += buildTooltip('heroic', boss[l].name, instances[j].icons[l], d, len, output[exp][inst.name]);
												}
											}
										} else {
											// boss doesn't exist, remove one from total
											// remove extra Ragnaros from Firelands
											d.bosses.flex--;
											d.bosses.normal--;
											d.bosses.heroic--;
										}

									}

									// caclulate rowspans for instance table cell
									z = (d.hasFlex && o.flex ? 2 : 1) + (o.heroics && instances[j].hasHeroic ? 1 : 0);

									// tables work better when overall width is <200 px... and really, I'm just lazy.
									t += '<table class="instance inst-' + instances[j].abbr + '"><tr>' +
									'<td rowspan="' + z + '" class="icon"><div class="icon"></div></td>' +
									'<td><span class="inst-name">' + instances[j][o.useAbbr ? 'abbr' : 'name' ] + '</span>';

									// include flex?
									if (d.hasFlex && o.flex) {
										t += buildProgressBar('flex', d) + '</td></tr><tr><td>';
									}
									// add normal
									t += buildProgressBar('normal', d) + '</td></tr>';

									// include heroics?
									if (o.heroics && instances[j].hasHeroic) {
										t += '<tr><td>' + buildProgressBar('heroic', d) + '</td></tr>';
									}

									t += '</div>';
								}
							} // end raider loop
						}

					} // end instance loop
					t += '</table></div>';

				} // end expansion loop

				if (o.debug) { log(output); }
				$(el).addClass('wowprogression').html(t);

				if (!o.details && o.clickForDetails) {
					$(el).find('.bar-bkgd').unbind('click').bind('click', function(){
						$('.tips .details').toggle();
					});
				}

				if (typeof o.initialized === "function" && !el.initialized) {
					o.initialized(el);
				}
				el.initialized = true;
			}; // end processRaids

			t = getRaiders();
			if (t.length) {
				results = $.when.apply($, t);
				results.done(function(){
					if (o.debug) { log('Loading complete: processing...'); }
					// successful initialization! YAY!
					processRaids();
					hasInitialized = true;
				});
				setTimeout(function(){
					// results.done is never called if there is a 404 error (misspelled or incorrect character name)
					// so lets just try to go with what we got. This would be an "unsuccessful" initialization, so
					// don't set the hasInitialized flag, in case results.done takes longer than 2 seconds.
					if (raiders.length > 0) {
						if (o.debug && !hasInitialized) { log("One or more raiders' JSON feeds failed to load..."); }
						processRaids();
					}
				}, 2000);
			}

		});

	};

})(jQuery);