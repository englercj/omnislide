/*
 * options variable
    {
        height: 35, //height of the timer
        width: 35,  //width of the timer
        border: 2, //space between filled and empty colors on the timer
        colors: {
            empty: 'rgba(10, 10, 10, 0.4)',     //color to show on unfilled time
            filled: 'rgb(150, 150, 150)'  //color to show as ellapsed time
        },
        refreshRate: 10, //time in ms between redraws (lower is smoother), also effects accuracy of wait time
        ringWidth: 5,
        style: 'ring'   //style of the timer; circle, ring, bar
    }
 */

(function (win, undefined) {
    win.slideTimer = function (animLen, options, callback, canvas) {
        if (!canvas)
            canvas = document.createElement('canvas');

        //init canvas
        canvas.height = options.height;
        canvas.width = options.width;
        canvas.className = 'slide-timer';

        var ctx = canvas.getContext('2d'),

        midX = canvas.width / 2,
        midY = canvas.height / 2,

        timeEllapsed = 0,

        //radianStart = Math.PI - 0.5,
        radianMax = Math.PI * 2,
        radius = canvas.width / 2,
        lastRad = 0,

        border = options.border,

        tickLoop = null,

        //paint background
        bgPaint = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = options.colors.empty;
            ctx.strokeStyle = options.colors.empty;

            switch (options.style) {
                case 'bar':
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(midX, midY, radius, 0, radianMax, false);
                    ctx.fill();
                    break;
                default: //ring
                    ctx.beginPath();
                    ctx.arc(midX, midY, radius - options.ringWidth / 2 - border, 0, radianMax, false);
                    ctx.lineWidth = options.ringWidth + (border * 2);
                    ctx.stroke();
                    break;
                    break;
            }
        },

        //paint forground based on % done
        fgPaint = function () {
            var prct = timeEllapsed / animLen;
            ctx.fillStyle = options.colors.filled;
            ctx.strokeStyle = options.colors.filled;

            switch (options.style) {
                case 'bar':
                    var w = (canvas.width * prct) - (border * 2);

                    w = (w < 0) ? 0 : w;
                    ctx.clearRect(border, border, w, canvas.height - (border * 2));
                    ctx.fillRect(border, border, w, canvas.height - (border * 2));
                    break;
                case 'circle':
                    var rads = (radianMax * prct) - lastRad;

                    ctx.beginPath();
                    ctx.moveTo(midX, midY);
                    ctx.arc(midX, midY, radius - border, lastRad, lastRad + rads, false);
                    ctx.fill();

                    lastRad = lastRad + rads;
                    break;
                default:
                    var rads = (radianMax * prct) - lastRad;

                    ctx.beginPath();
                    ctx.arc(midX, midY, radius - (options.ringWidth / 2) - border, lastRad, lastRad + rads, false);
                    ctx.lineWidth = options.ringWidth;
                    ctx.stroke();

                    lastRad = lastRad + rads;
                    break;
            }
        },

        //clear canvas
        clearCanvas = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        tick = function () {
            if (timeEllapsed == animLen) {
                timer.reset();
                callback();
                return;
            }

            timeEllapsed += options.refreshRate;
            fgPaint();
        },

        timer = {
            setTimeLeft: function (time) {
                if (timer.locked) return false;
                if (time > animLen || time < 0) return false;

                timeLeft = time;
                paint();
                return true;
            },
            start: function () {
                if (timer.locked) return false;

                tickLoop = setInterval(tick, options.refreshRate);
                timer.stopped = false;
            },
            stop: function () {
                if (timer.locked) return false;

                clearInterval(tickLoop);
                timer.stopped = true;
            },
            reset: function () {
                if (timer.locked) return false;

                timer.stop();
                clearCanvas();
                lastRad = 0;
                timeEllapsed = 0;
                bgPaint();
            },
            lock: function () { timer.locked = true; },
            unlock: function () { timer.locked = false; },
            stopped: true,
            locked: false,
            canvas: canvas
        };

        timer.reset();

        //Public Interface
        return timer;
    }
})(window);