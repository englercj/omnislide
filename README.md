# OmniSlide (v0.5 BETA)

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

The slider requires [`jQuery 1.6+`](http://jquery.com/). For a minimal install, the only *required* file is `js/jquery.omnislide.js`. However, there are many features left out with only that implementation. Most notably the slider will look like crap. In order to bring some style to the slide include at least the base theme found in `css/omnislide.theme.base.css`. 

Other features such as advanced transitions and the canvas timer require the files `js/omnislide.transitions.js` and `js/omnislide.timer.js` respectively. Also, `img/sprite.png` provides a simple control button sprite for use in the slide navigation.

For a minimal install, include the following in your HTML:

	<!-- OmniSlide Theme CSS -->
	<link type="text/css" rel="stylesheet" href="css/jquery.slide.css" />
	<!-- However you include jQuery -->
    <script src="js/libs/jquery/1/jquery.min.js"></script>
	<!-- OmniSlide Functional JS -->
	<script src="js/jquery.omnislide.js"></script>

To use the advanced themes, and timer you will need to include those as well:

	<!-- Enables advanced transition support -->
	<script src="js/omnislide.transitions.js"></script>
	<!-- Enables canvas timer support -->
	<script src="js/omnislide.timer.js"></script>

## Usage

The slider uses the format of:

	$(output_Element).omnislide({ slides: slide_Content_Input });

Using the slider can be as simple or as complex as you wish. The slider has the ability to intelligently determine the type of input you give it. Meaning, you can pass in XML string data, an XML document, a DOM element, jQuery object, or jQuery selector (__Note:__ if you pass a DOM or jQuery Object, it must be a `<ul/>` element in the proper format). 

Here is an example of the basic usage using defaults:

#### HTML

	<div id="sliderUl"></div>
    <ul id="slides">
        <li title="The First Slide Title">
            <img class="slide-thumb" src="" alt="" /> <!-- Image to be used as slide thumbnail -->
            <img class="slide-image" src="img/slides/1.jpg" alt="" /> <!-- Image to be used as the slide image -->
            <div class="slide-content">HTML Content of the slide</div>
            <div class="slide-overlay">Some overlay content to go on the first slide</div>
        </li>
        <li>
			<!-- You can use a many or as little of the elements as you want -->
            <img class="slide-image" src="img/slides/2.jpg" alt="" />
        </li>
	</ul>

#### Javascript

	$(function () {
		$('#sliderUl').omnislide({ slides: '#slides' });
	});

The plugin will use the `<ul/>` passed in to create the slider. It does __NOT__ use the `<ul/>` markup as the actual slider. It will hide that element, and create its own HTML. This method was chosen so that the API for passing the plugin data, and the actual implementation of the slider are decoupled. So the theming API can change without changing the input API and visa versa.

Here is another example using some XML that is pulled in using AJAX:

#### HTML

	<div id="sliderXml"></div>

#### Javascript

	$(function () {
		$.get('slides.xml', function (data) {
			//passes in xml as an XML Document
			//string XML data will work as well
            $('#sliderXml').slide({ slides: data });
        });
	});

Finally, if you decide to remove the slider from the page simply call a destroy on the `output_Element` that you initialized earlier. So for the `<ul/>` example I would make the following call to return my page to the state it was in before I initialized the slider:

	$('#sliderUl').omnislide('destroy');

More advanced usage examples can be found in the [Advanced Usage](#) Documentation

## Transitions

Transitions are specified using the `transition` option when instantiating the plugin, or by setting the `transition` variable on-the-fly using:

	$('#slider').omnislide('option', 'transition', { effect: 'boxFade' });
	//OR
	$('#slider').omnislide('option', 'transition.effect', 'boxFade');

You can use a custom transition effect by setting `transition.type` to `'custom'` and providing an animation function in the `transition.effect` option. Another option is to package your custom transitions into a transition plugin, to be then used by the plugin. Documentation on the subject can be found on the [Transition API](#) Wiki page.

## Theming

Something unique to OmniSlide is the theming classes. All controls and components are assigned classes that allow you to theme the slider to your preference. All CSS sprites can be easily replaced. This slider was designed to provide functionality, without forcing you into a style. That way you can take the slider and brand it to your website, quickly and easily.

If you open `css/omnislide.theme.base.css` you will find a skeleton theme. You can modify the base theme to make the slide conform to any look and feel.

More information can be found in the [Theme API](https://github.com/englercj/OmniSlide/wiki/Theme-API) Documentation

## Notes

* To use custom transitions, or to extend the built-in transitions you must include `js/omnislide.transitions.js`
* Slider has only been tested _minimally_ in FF8, Chrome 15, and IE9
* For the theme API note the z-index levels:
    * The slide-box is at z-index 2
	* A slide is at z-index 3
	* The active slide is at z-index 4
	* If you are using the transitionapi, transition boxes are at z-index 7
	* Overlays (navigation, title, overlay, timer, etc) are at z-index 10

## TODO

* [Later] More slide orders (spiral, checker, alternate) [alternate can combine with all others]
* [Now] Themes

## Known Bugs
* Setting slide overrides via the `$().OmniSlide('option')` interface doesn't work properly
* I'm sure some combo of `animAsOverlay` and `visible` will break my overlay animation logic