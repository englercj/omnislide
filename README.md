# OmniSlide (v0.7 BETA)

OmniSlide is an amazing new slider being built to be a one-stop-shop for your slider needs. This slider is meant to replace your need for any other slider by combining all the best features found in all sliders out there. It also adds some new features like theming and custom transitions to the mix as well.

## Features

Here are some of the features that OmniSlide supports:

* Image slideshows
* HTML Content
* HTML Titles and Overlays
* Canvas timer (bar, circle, or ring styles)
* Slide Navigation Controls
* Slide Thumbnails
* XML input support
* Extensible Advanced Transitions
* Flexible Theming Classes
* And More!

## Installation

The slider requires [`jQuery 1.4.3+`](http://jquery.com/). For a minimal install, the only *required* files are `js/jquery.omnislide.js` and `css/omnislide.base.css`. However, there are many features left out with only that implementation. Most notably the slider will look like crap. In order to bring some style to the slide include a theme found in `themes/THEME_NAME/omnislide.theme.THEME_NAME.css`. 

Advanced transitions require the file `js/omnislide.transitionapi.js`.

For a minimal install, include the following in your HTML:

	<!-- OmniSlide Base & Theme CSS -->
	<link type="text/css" rel="stylesheet" href="css/omnislide.base.css" />
	<link type="text/css" rel="stylesheet" href="themes/simple/omnislide.theme.simple.css" />
	<!-- However you include jQuery -->
    <script src="js/libs/jquery/1/jquery.min.js"></script>
	<!-- OmniSlide -->
	<script src="js/jquery.omnislide.js"></script>

To use the advanced themes you will need to include the API as well:

	<!-- Enables advanced transition support -->
	<script src="js/omnislide.transitionapi.js"></script>

## Usage

The slider uses the format of:

	$(output_Element).OmniSlide({ slides: slide_Content_Input });

Using the slider can be as simple or as complex as you wish. It has the ability to intelligently determine the type of input you give it. Meaning, you can pass in XML string data, an XML document, a DOM element, jQuery object, or jQuery selector (__Note:__ if you pass a DOM or jQuery Object, it must be a `<ul/>` element in the proper format). 

Here is an example of the basic usage using defaults:

#### HTML

	<div id="sliderUl"></div>
    <ul id="slides">
        <li title="The First Slide Title">
            <img class="slide-thumb" src="" alt="" /> <!-- Image to be used as slide thumbnail -->
            <img class="slide-image" src="img/slides/1.jpg" alt="" /> <!-- Image to be used as the slide background image -->
            <div class="slide-content">HTML Content of the slide if any</div>
            <div class="slide-overlay">Some overlay content to go on the first slide</div>
        </li>
        <li>
			<!-- You only have to use the elements you want -->
            <img class="slide-image" src="img/slides/2.jpg" alt="" />
        </li>
	</ul>

#### Javascript

	$(function () {
		$('#sliderUl').OmniSlide({ slides: '#slides', theme: 'simple' });
	});

The plugin will use the `<ul/>` passed in to create the slider. It does __NOT__ use the `<ul/>` markup as the actual slider. It will hide that element, and create its own HTML. This method was chosen so that the API for passing the plugin data, and the actual implementation of the slider are decoupled. So the theming API can change without changing the input format and visa versa.

Here is another example using some XML that is pulled in using AJAX:

#### HTML

	<div id="sliderXml"></div>

#### Javascript

	$(function () {
		$.get('slides.xml', function (data) {
			//passes in xml as an XML Document
			//string XML data will work as well
            $('#sliderXml').OmniSlide({ slides: data, theme: 'simple' });
        });
	});

Finally, if you decide to remove the slider from the page simply call a destroy on the `output_Element` that you initialized earlier. So for the `<ul/>` example I would make the following call to return my page to the state it was in before I initialized the slider:

	$('#sliderUl').omnislide('destroy');

More advanced usage examples can be found in the [Advanced Usage](#) Documentation

## Transitions

Transitions are specified using the `transition` option when instantiating the plugin, or by modifying the `transition` option on-the-fly using the `'option'` method:

	$('#slider').OmniSlide({ slides: data, theme: 'simple', transition: { effect: 'fadeOut' } });
	$('#slider').OmniSlide('option', 'transition', { effect: 'growIn' });
	//OR
	$('#slider').OmniSlide('option', 'transition.effect', 'colShrinkOut');

You can create custom transition effects using the transition API. You can even package your custom transitions into a definition file for use with OmniSlide. To learn more please visit the [Transition API Documentation](#).

## Theming

Something unique to OmniSlide is the theming classes. All controls and components are assigned classes that allow you to theme the slider to your preference. This slider was designed to provide functionality, without forcing you into a style. That way you can take the slider and brand it to your website, quickly and easily. You can even have multiple themes on different sliders **on the same page**!

If you open `themes/simple/omnislide.theme.simple.css` you will find a simple starting theme.

More information can be found in the [Theme API Documentation](#).

## Notes

* To use custom transitions, or to extend the built-in transitions you must include `js/omnislide.transitionapi.js`
* For the theme API note the z-index levels:
    * The slide-box is at z-index 2
	* A slide is at z-index 3
	* The active slide is at z-index 4
	* If you are using the transitionapi, transition boxes are at z-index 7
	* Overlays (navigation, title, overlay, timer, etc) are at z-index 10

## TODO

* [After Release] More slide orders (spiral, checker, alternate) [alternate can combine with all others]
* [Before Release] Themes
* [Before Release] More browser testing. FF 8, IE 9, and Chrome 15/16 are good.

## Known Bugs
* Setting slide overrides via the `$().OmniSlide('option')` interface doesn't work properly
* I'm sure some combo of `animAsOverlay` and `visible` will break my overlay animation logic