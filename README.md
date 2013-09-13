# **Features** ([demo](http://Unrepentant.github.com/wowProgression/index.html))

* Automatic updates - uses the World of Warcraft API to obtain information.
* Works with any region and language.
* Easy to set up. Add your:
  * Battle net domain
  * locale
  * Server name
  * Guild name
  * One or more of your raider's names
* Change the appearance &amp; styling
  * Show instance progress in a fraction (6/7) or as a percentage (86%).
  * Tooltips can show modifiable text/HTML to show that a boss has been killed, or the number of average kills (between all raiders).
  * All styling of the progression &amp; tooltips can be modified using css.
  * The plugin uses Blizzard's instance &amp; boss icons, so these are not as easily changed. I'll work on this if there is any demand for it.

# **Notes**

* Guild progression is determined from individual raider progression.
* A boss is determined to be killed when a set number of raiders have killed a boss (see the [ratio](https://github.com/Unrepentant/wowProgression/wiki/Options#wiki-ratio) option).
* Guild run achievements were not used because they didn't seem to return consistent results. Also only the last heroic boss is tracked.
* The number of boss kills can also be added to the tooltip. But because every raider has a different value, it averages the number of kills. So if a raider that has no boss kills is included, it may drastically affect the average.
* Any tooltip plugin can be used along with this script.

# **Screenshots**

### Showing fractional boss count with killed boss text
![fractions](http://Unrepentant.github.com/wowProgression/demo/screenshot1.jpg)

### Showing percentage complete with killed boss text and number of kills (averaged)
![percentage](http://Unrepentant.github.com/wowProgression/demo/screenshot2.jpg)

### Showing specific raider kill details inside the tooltip (see the [details](https://github.com/Unrepentant/wowProgression/wiki/Options#wiki-details) option)
![details](http://Unrepentant.github.com/wowProgression/demo/screenshot3.jpg)

# **Documentation**

* [Setup](https://github.com/Unrepentant/wowProgression/wiki/Setup)
* [Options](https://github.com/Unrepentant/wowProgression/wiki/Options)
* [Change Log](https://github.com/Unrepentant/wowProgression/wiki/Change)

# **Dependencies**

* jQuery 1.5+ (required)
* tooltip plugin ([Jatt](https://github.com/Mottie/Jatt) plugin used in the demo)

# **Licensing**

* [MIT License](http://www.opensource.org/licenses/mit-license.php).

# **To Do**

* Better error handling for misspelled names

# **Change Log**

### Version 1.4.0

* Added Siege of Orgrimmar instance.
* Fixed the normal instance total number of bosses within the details display (click on any progress bar to see it).

### Version 1.3.0

* Fixed an issue with the plugin not working with localized languages properly.
  * The plugin now uses the instance ID instead of the instance name, so now all intances names are localized properly.
  * To change the language of the expansion name, modify the `allexps` option.

      ```javascript
      allexps : {
        "mists" : "mistery",   // get it? HA!
        "cat"   : "cataclyzum" // I spell guud
      }
      ```

* Added a `debug` option which outputs to the console for troubleshooting.

### Version 1.2.1

* Updated css to include the new raid icon

### Version 1.2

* Added Throne of Thunder instance (patch 5.2)

### Version 1.1

* Hacked around the issue of handling errors for misspelled names.
  * Basically, if JSONP requests aren't successful, they don't trigger any events ([ref](http://stackoverflow.com/a/310084/145346)).
  * If only part of the data has completed loading, this plugin will attempt to build the progression display with what it has already loaded.
  * If the JSONP requests are all successful, but delayed such that the alloted time (setTimeout set to 2 seconds) has passed, it will build the progression display again with all of the data.
  * I know this isn't an ideal solution, so if you can figure out a better way, please feel free to fork and push some changes!

### Version 1.0.1

* Removed escaping of character names as it was improperly encoding special characters.

### Version 1.0

* Fixed empty raider string issues.
  * A javascript error will no longer occur.
  * Ratios will now calculate properly - empty strings not included in the number of raiders.

### Version 1.2 beta

* Script will now ignore the case in raider names.
* Added `details` option:
  * If `true`, it adds raider boss kills to the bottom of the tooltip (see the screenshots).
  * This enables the admin to check if the script is working properly or if a raider needs to be excluded from the list.
  * These details will always be present within the tooltip, and only hidden when this option is `false`.
  * The style can be modified using css.
  * These details were only meant for debugging, so it's not perfect; e.g. the Bastion of Twilight normal mode details will show 5 bosses, instead of the correct 4.

* Added `clickForDetails` option:
  * When `true` clicking on a progress bar will reveal or hide (toggle) the details within the tooltip.
  * Set this to `false` to never enable progress bar clicking.

### Version 1.1 beta

* Empty strings in the raiders option will now be ignored.

### Vesion 1.0 beta

* Initial release.