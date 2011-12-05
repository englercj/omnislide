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
    win.slide.transition = function (options, $slides, index, next, callback) {
        //setup some reasonable defaults
        options.easing = options.easing || 'linear';
        options.wait = options.wait || 5000;
        options.length = options.length || 500;
        options.direction = options.direction || 'down';
        options.position = options.position || 'top';

        //error catching and calling and such
        var transitions = slide.transitions,
            defaults = slide.transitions.defaults;

        if (transitions[options.type]) {
            if (transitions[options.type][options.effect]) {
                return transitions[options.type][options.effect]($slides, index, next, options, callback);
            } else {
                slide.warn('Unable to find effect %s in transition %s, using default effect %s', options.effect, options.type, options.type);
                return transitions[options.type][defaults[options.type]]($slides, index, next, options, callback);
            }
        } else {
            slide.warn('Unable to find transition %s, defaulting to transition fade:full', options.type);
            return transitions.fade.full($slides, index, next, options, callback);
        }
    };

    //definition of all transition functions
    //in the global object so they can be extended
    //externally
    win.slide.transitions = {
        strips: {
            wave: function ($slides, index, next, options, callback) { },
            zipper: function ($slides, index, next, options, callback) { },
            curtain: function ($slides, index, next, options, callback) { }
        },
        boxes: {
            diagonal: function ($slides, index, next, options, callback) { },
            row: function ($slides, index, next, options, callback) { },
            random: function ($slides, index, next, options, callback) { }
        },
        fade: {
            full: function ($slides, index, next, options, callback) {
                $slides.eq(next).show();
                $slides.eq(index).fadeOut(options.length, options.easing, function () {
                    $slides.eq(index).removeClass('active');
                    $slides.eq(next).addClass('active');

                    if (callback) callback();
                });
            },
            directional: function ($slides, index, next, options, callback) { }
        },
        cut: {
            full: function ($slides, index, next, options, callback) {
                $slides.eq(index).hide();
                $slides.eq(index).removeClass('active');
                $slides.eq(next).show();
                $slides.eq(next).addClass('active');

                if (callback) callback();
            }
        }
    };

    win.slide.transitions.defaults = {
        strips: 'wave',
        boxes: 'random',
        fade: 'full',
        cut: 'full'
    };

    /*
     * Transition extension example
     *
        $.extend(true, slide.transitions, {
            hey: {
                there: function ($slides, index, next, options, callback) {
                    slide.log('Hey There!');

                    if(callback) callback();
                }
            },
            defaults: {
                hey: 'there'
            }
        });
    */
})(jQuery, window);