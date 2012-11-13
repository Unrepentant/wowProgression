# **Features** ([demo](http://mottie.github.com/wowProgression/index.html))

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
* A boss is determined to be killed when a set number of raiders have killed a boss (see the [ratio](https://github.com/Mottie/wowProgression/wiki/Options#wiki-ratio) option).
* Guild run achievements were not used because they didn't seem to return consistent results. Also only the last heroic boss is tracked.
* The number of boss kills can also be added to the tooltip. But because every raider has a different value, it averages the number of kills. So if a raider that has no boss kills is included, it may drastically affect the average.
* Any tooltip plugin can be used along with this script.

# **Screenshots**

### Showing fractional boss count with killed boss text
![fractions](http://mottie.github.com/wowProgression/demo/screenshot1.jpg)

### Showing percentage complete with killed boss text and number of kills (averaged)
![percentage](http://mottie.github.com/wowProgression/demo/screenshot2.jpg)

# **Documentation**

* [Setup](https://github.com/Mottie/wowProgression/wiki/Setup)
* [Options](https://github.com/Mottie/wowProgression/wiki/Options)
* [Change Log](https://github.com/Mottie/wowProgression/wiki/Change)

# **Dependencies**

* jQuery 1.5+ (required)
* tooltip plugin ([Jatt](https://github.com/Mottie/Jatt) plugin used in the demo)

# **Licensing**

* [MIT License](http://www.opensource.org/licenses/mit-license.php).

# **To Do**

* Better error handling for misspelled names

# **Change Log**

### Version 1.1 beta

* Empty strings in the raiders option will now be ignored.

### Vesion 1.0 beta

* Initial release.