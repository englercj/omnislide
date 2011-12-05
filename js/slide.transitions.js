/*
 * Each transition has its own options, but they follow the format:
 * slide.transition(options);
 * WHERE options contains ATLEAST
    {
        type: 'fade',       //the type of transition to use
        effect: 'full',     //specific transition effect (like 'wave' or 'zipper' for 'strips')
        easing: 'linear',   //the type of easing to use on transitions
        wait: 5000,         //the wait time to show each slide 
        length: 500,        //how long the transition animates

        direction: '',      //direction the animation goes (like 'down' or 'right')
        position: '',       //start position of the animation (like 'top' or 'topleft')

        animatorNum = 20,   //applies to strips/boxes; is the number of strips/boxes
        animatorDelay = 50  //applies ot strips/boxes; delay between each strip/box
    }
*/

(function ($, win, undefined) {
    if (!win.slide) win.slide = {};

    win.slide.transition = function (options, $slides, index, next, callback) {
        //setup some reasonable defaults
        options.easing = options.easing || 'linear';
        options.wait = options.wait || 5000;
        options.length = options.length || 500;
        options.direction = options.direction || 'down';
        options.position = options.position || 'top';

        //definition of all transition functions
        var transitions = {
            strips: {
                wave: function () { },
                zipper: function () { },
                curtain: function () { }
            },
            boxes: {
                diagonal: function () { },
                row: function () { },
                random: function () { }
            },
            fade: {
                full: function () {
                    $slides.eq(next).show();
                    $slides.eq(index).fadeOut(options.length, options.easing, function () {
                        $slides.eq(index).removeClass('active');
                        $slides.eq(next).addClass('active');

                        callback();
                    });
                },
                directional: function () { }
            }
        },
        defaults = {
            strips: transitions.strips.wave,
            boxes: transitions.boxes.random,
            fade: transitions.fade.full
        }

        if (transitions[options.type]) {
            if (transitions[options.type][options.effect]) {
                return transitions[options.type][options.effect]();
            } else {
                slide.warn('Unable to find effect %s in transition %s, using default method', options.effect, options.type);
                return defaults[options.type]();
            }
        } else {
            slide.warn('Unable to find transition %s, defaulting to transition fade:full', options.type);
            return transitions.fade.full();
        }
    }
})(jQuery, window);