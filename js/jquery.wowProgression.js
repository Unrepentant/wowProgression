/*! WoW Progression v1.0
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
/*global escape:true */
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
				// show heroics?
				heroics : true,
				// 75% of raiders showing kill before boss counted as killed
				ratio   : 0.75,
				// instance boss count (inside progress bar)
				// {n} = number kill count, {t} = total, {p} = percentage
				count   : '{p}',
				// boss killed text/count (inside tooltip)
				// use {s} for none/killed status text, {n} for number of kills (avg), or both
				status  : "{s}",
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
				// list of all raids in each expansion, with abbreviations & boss icons
				allraids: {
					"mists": [
					{ abbr: "ToES", hasHeroic: true, name: "Terrace of Endless Spring", icons: [60583, 62442, 62983, 60999] },
					{ abbr: "HoF",  hasHeroic: true, name: "Heart of Fear", icons: [62980, 62543, 62164, 62397, 62511, 62837] },
					{ abbr: "MV",   hasHeroic: true, name: "Mogu'shan Vaults", icons: [60051,60009,60143,60701,60410,60396] }
					],
					"cat": [
					{ abbr: "DS",   hasHeroic: true, name: "Dragon Soul", icons: [55265,55308,55312,55689,55294,56427,53879,57962] },
					{ abbr: "FL",   hasHeroic: true, name: "Firelands", icons: [52498,52558,53691,52530,53494,52571,52409] },
					{ abbr: "ToFW", hasHeroic: true, name: "Throne of the Four Winds", icons: [45871,46753] },
					// heroicBoss was added as a hack to make the last boss in the instance only show up in heroic mode; in this case it's Sinestra
					{ abbr: "BoT",  hasHeroic: true, name: "The Bastion of Twilight", icons: [44600,45993,43687,43324,45213], heroicBoss: true },
					{ abbr: "BD",   hasHeroic: true, name: "Blackwing Descent", icons: [42179,41570,41442,43296,41378,41376] },
					{ abbr: "BH",   hasHeroic: false, name: "Baradin Hold", icons: [47120,52363,55869] }
					]
				},

				// ** Callbacks **
				// initialized callback function
				initialized: null,

				// ** Debugging **
				// set to true to show all raider information (for debugging)
				details : false,
				// click to show details
				clickForDetails : true

			}, options),

			// blizzard api: http://blizzard.github.com/api-wow-docs/#features/access-and-regions
			api = "http://" + (o.region === "cn" ? "www.battlenet.com.cn" : o.region + ".battle.net") + "/api/wow/character/" + escape(o.server) + "/",

			// boss icon root
			iconroot = "http://media.blizzard.com/wow/renders/npcs/portrait/creature", // + ".jpg"

			raids = [],
			expansion = {},
			raiders = [],
			t, results,

			getWoWJSON = function(name){
				return jQuery.getJSON(api + escape(name) + "?locale=" + o.locale + "&fields=progression&jsonp=?", function(data){
					if (data && data.progression) {
						raiders.push(data.name.toLocaleLowerCase());
						raids.push(data.progression.raids);
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

			processRaids = function(){
				var i, j, k, l, m, n, p, z,
				bh, bn, bt, bt2, c, cn, ch,
				dbt, dbn, dbh,
				t = '', th, tn, ttn, tth,
				inst, instances, boss, exp,
				len;
				// loop through expansions
				for (i = 0; i < o.show.length; i++) {
					/*jshint loopfunc: true */
					exp = o.show[i];
					//
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
								if (inst && inst.name === instances[j].name) {
									// make tooltip
									ttn = ''; tth = ''; dbt = []; dbn = []; dbh = [];
									boss = inst.bosses;
									bn = 0; bh = 0;
									bt = boss.length;
									bt2 = bt;
									// find instance boss kill counts
									for (l = 0; l < bt; l++) {

										// Check for instance icon, if it doesn't exist, don't add it (removes Ragnaros repeat)
										if (instances[j].icons[l]) {
											dbt.push(l+1); // details boss # in header
											cn = 0; tn = 0;
											ch = 0; th = 0;
											// check other raiders
											for (m = 0; m < len; m++){
												// check that the raider is listed in the current expansion
												z = expansion[exp][m];
												n = $.inArray( (z || '').toLocaleLowerCase(), raiders );
												if (n >= 0) {
													// add raider names to detailed report
													if (!dbn[m]) { dbn[m] = [z]; }
													if (!dbh[m]) { dbh[m] = [z]; }
													// calculate boss kills
													if (raids[n][k].bosses[l].normalKills > 0) {
														dbn[m].push('+');
														cn++;
														tn += raids[n][k].bosses[l].normalKills;
													} else {
														dbn[m].push('-');
													}
													if (raids[n][k].bosses[l].heroicKills > 0) {
														dbh[m].push('+');
														ch++;
														th += raids[n][k].bosses[l].heroicKills;
													} else {
														dbh[m].push('-');
													}
												}
											}
											// update boss kill count
											if (cn/len >= o.ratio) { bn++; }
											if (ch/len >= o.ratio) { bh++; }

												// normal status  : '{s}' for killed text; '{n}' for number of kills
											c = fixQuotes(o.status).replace(/\{(s|n)\}/g, function(m){ return {
													'{s}' : cn/len >= o.ratio ? fixQuotes(o.text.killed) : fixQuotes(o.text.none),
													'{n}' : tn/len < o.ratio ? fixQuotes(o.text.zero) : Math.ceil(tn/len) // avg number of total kills
												}[m];
											});

											if (instances[j].heroicBoss && l === inst.bosses.length - 1) {
												bt2 = bt - 1;
												// skip Sinestra in BoT
											} else {
												ttn += "<div class='boss " + (cn/len >= o.ratio ? 'boss-killed' : '') + "'>" +
												"<img class='boss-icon' src='" + iconroot + instances[j].icons[l] + ".jpg'>" +
												"<span class='boss-name'>" + fixQuotes(boss[l].name) + "</span>" +
												"<span class='boss-status'>" + c + "</span></div>";
											}

											// include heroics?
											if (o.heroics) {
												c = fixQuotes(o.status).replace(/\{(s|n)\}/g, function(m){ return {
														'{s}' : ch/len >= o.ratio ? fixQuotes(o.text.killed) : fixQuotes(o.text.none),
														'{n}' : th/len < o.ratio ? fixQuotes(o.text.zero) : Math.ceil(th/len) // avg number of total kills
													}[m];
												});

												tth += "<div class='boss " + (ch/len >= o.ratio ? 'boss-killed' : '') + "'>" +
												"<img class='boss-icon' src='" + iconroot + instances[j].icons[l] + ".jpg'>" +
												"<span class='boss-name'>" + fixQuotes(boss[l].name) + "</span>" +
												"<span class='boss-status'>" + c + "</span></div>";
											}
										} else {
											// boss doesn't exist, remove one from total
											// remove extra Ragnaros from Firelands
											bt = bt - 1;
											bt2 = bt2 - 1;
										}

									}
									p = Math.round(bn/bt2 * 100) + '%'; // % killed
										// output format : {n}/{t} or {p}
									c = o.count.replace(/\{[n|p|t]\}/g, function(m){ return {
											'{p}' : p,
											'{n}' : bn,
											'{t}' : bt2
										}[m];
									});

									ttn = "<div class='inst'><div class='inst-title'>Normal <span class='inst-count'>" +
										bn + "/" + bt2 + " (" + p + ")</span></div></div>" + ttn;
									// add details
									ttn += "<div class='details'" + (o.details ? "" : " style='display:none'") +
										"><hr><table><tr><td>Raider</td><td class='mono'>" + dbt.join(' ') + "</td></tr>";
									for (m = 0; m < len; m++){
										if (dbn[m]) {
											ttn += "<tr><td>" + dbn[m].shift() + "</td><td class='mono'>" + dbn[m].join(' ') + "</td></tr>";
										}
									}
									ttn += "</table></div>";

									// tables work better when overall width is <200 px... and really, I'm just lazy.
									t += '<table class="instance inst-' + instances[j].abbr + '"><tr>' +
									'<td' + (o.heroics && instances[j].hasHeroic ? ' rowspan="2"' : '') + ' class="icon"><div class="icon"></div></td>' +
									'<td><span class="inst-name">' + instances[j][o.useAbbr ? 'abbr' : 'name' ] + '</span>' +
									'<div class="bar-bkgd bar-normal ' + o.tooltip + '" title="<div class=tips>' + ttn + '</div>">' +
									'<div class="bar-color" style="width: ' + p + ';"><span class="bar-text">' + c + '</span></div>' +
									'</td></tr>';

/*
t += '<div class="instance inst-' + instances[j].abbr + ' clear"><span class="icon"></span>' +
	'<span class="inst-name">' + instances[j][o.useAbbr ? 'abbr' : 'name' ] + '</span>' +
	'<div class="bar-bkgd bar-normal ' + o.tooltip + '" title="<div class=tips>' + ttn + '</div>">' +
	'<div class="bar-color" style="width: ' + p + ';"><span class="bar-text">' + c + '</span></div>' +
	'</div>';
*/

									// include heroics?
									if (o.heroics && instances[j].hasHeroic) {
										p = Math.round(bh/bt * 100) + '%'; // % killed
										// output format : {n}/{t} or {p}
										c = o.count.replace(/\{[n|p|t]\}/g, function(m){ return {
												'{p}' : p,
												'{n}' : bh,
												'{t}' : bt
											}[m];
										});

										tth = "<div class='inst'><div class='inst-title'>Heroic <span class='inst-count'>" +
											bh + "/" + bt + " (" + p + ")</span></div></div>" + tth;

										// add details
										tth += "<div class='details'" + (o.details ? "" : " style='display:none'") +
											"><hr><table><tr><td>Raider</td><td class='mono'>" + dbt.join(' ') + "</td></tr>";
										for (m = 0; m < len; m++){
											if (dbh[m]) {
												tth += "<tr><td>" + dbh[m].shift() + "</td><td class='mono'>" + dbh[m].join(' ') + "</td></tr>";
											}
										}
										tth += "</table></div>";

										t += '<tr><td><div class="bar-bkgd bar-heroic ' + o.tooltip + '" title="<div class=tips>' + tth + '">' +
											'<div class="bar-color" style="width: ' + p + ';"><span class="bar-text">' + c + '</span></div>' +
											'</div></td></tr>';

/*
t += '<div class="bar-bkgd bar-heroic ' + o.tooltip + '" title="<div class=tips>' + tth + '">' +
	'<div class="bar-color" style="width: ' + p + ';"><span class="bar-text">' + c + '</span></div>' +
	'</div>';
*/

									}

									t += '</div>';
								}
							} // end raider loop
						}

					} // end instance loop
					t += '</table></div>';

				} // end expansion loop

				$(el).addClass('wowprogression').html(t);

				if (!o.details && o.clickForDetails) {
					$(el).find('.bar-bkgd').bind('click', function(){
						$('.tips .details').toggle();
					});
				}

				el.initialized = true;
				if (typeof o.initialized === "function") {
					o.initialized(el);
				}
			}; // end processRaids

			t = getRaiders();
			if (t.length) {
				results = $.when.apply($, t);
				results.done(function(){
					processRaids();
				});
			}

		});

	};

})(jQuery);