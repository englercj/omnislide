OmniSlide
=============
OmniSlide is an amazing new slider being built to be a one-stop-shop for your slider needs. 
This slider is meant to replace your need for any other slider by combining all the best
features found in all sliders out there. It also adds some new features like theming and
custom transitions to the mix as well.

Features
--------

Here are some of the features that OmniSlide supports:

* Image slideshows
* HTML Content (__WIP__)
* HTML Titles and Overlays
* Canvas timer (bar, circle, or ring styles)
* Slide Navigation Controls
* Dynamic Thumbnails (__WIP__)
* XML input support
* Extensible Advanced Transitions (__WIP__)
* Flexible Theming Classes
* And More!

Usage
-----

The slider uses the format of:

~~~~~ javascript
	$(output_Element).omnislide({ slides: slide_Content_Input });
~~~~~

Using the slider can be as simple or as complex as you wish. The slider has the ability to intelligently
determine the type of input you give it. Meaning, you can pass in XML string data, an XML document, 
a DOM element, jQuery object, or jQuery selector (__Note:__ if you pass a DOM or jQuery Object, it must be
a `<ul/>` element in the proper format). Here is an example of the basic usage using defaults:

### HTML

~~~~~ html
	<div id="sliderUl"></div>
    <ul id="slides">
        <li title="The First slide Title">
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
~~~~~

### Javascript

~~~~~ javascript
	$(function () {
		$('#sliderUl').omnislide({ slides: '#slides' });
	});
~~~~~

The plugin will use the `<ul/>` passed in to create the slider. It does __NOT__ use the `<ul/>` markup
as the actual slider. It will hide that element, and create its own HTML. This method was chosen so that
the API for passing the plugin data, and the actual implementation of the slider are decoupled. So the
theming API can change without changing the input API and visa versa.

Here is another example using some XML that is pulled in using AJAX:

### HTML

~~~~~ html
	<div id="sliderXml"></div>
~~~~~

### Javascript

~~~~~ javascript
	$(function () {
		$.get('slides.xml', function (data) {
			//passes in xml as an XML Document
			//string XML data will work as well
            $('#sliderXml').slide({ slides: data });
        });
	});
~~~~~

Finally, if you decide to remove the slider from the page simply call a destroy on the `output_Element`
that you initialized earlier. So for the `<ul/>` example I would make the following call to return my
page to the state it was in before I initialized the slider:

~~~~~ javascript
	$('#sliderUl').omnislide('destroy');
~~~~~~

Theming
-------

Something unique to OmniSlide is the theming classes. All controls and components are assigned 
classes that allow you to theme the slider to your preference. All CSS sprites can be easily replaced.
This slider was designed to provide functionality, without forcing you into a style. That way you
can take the slider and brand it to your website, quickly and easily.

If you open `css/omnislide.theme.base.css` you will find a skeleton theme. You can modify the base 
theme to make the slide conform to any look and feel.

Installation
------------

The slide requires [`jQuery 1.6+`](http://jquery.com/). For a minimal install, the only *required* file is
`js/jquery.omnislide.js`. However, there are many features left out with only that implementation. Most notably
the slider will look like crap. In order to bring some style to the slide include atleast the base theme found
in `css/omnislide.theme.base.css`. Other features such as advanced transitions and the canvas timer require the
files `js/omnislide.transitions.js` and `js/omnislide.timer.js` respectively. Also, `img/sprite.png` provides a 
simple control button sprite for use in the slide navigation.

For a minimal install, include the following in your HTML:

~~~~~ html
	<link type="text/css" rel="stylesheet" href="css/jquery.slide.css" />
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
	<script src="js/jquery.omnislide.js"></script>
~~~~~

To use the advanced themes, and timer you will need to include those as well:

~~~~~ html
	<script src="js/omnislide.transitions.js"></script>
	<script src="js/omnislide.timer.js"></script>
~~~~~

Notes
-----

* To use custom transitions, or to extend the built-in transitions you must include `js/omnislide.transitions.js`
* Currently only image slideshows work with advanced transitions (working on HTML support)
* The nav controlls are _really_ buggy right now. Need to rewrite their functionality.