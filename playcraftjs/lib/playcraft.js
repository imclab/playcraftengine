/**
 * Playcraft Engine
 */

(function (window) { window.pc = {}; })(window);
pc.VERSION = '0.33';


/**
 * Simple javascript loader. Loads sources in a linear order (the order they are added to the loader).
 * This ensures dependencies based on the order of loading. It isn't particularly super efficient, but is
 * generally only used for development; and the difference in loading times over fast connections is minimal.
 * For production deployment you should be packing/minimizing the game into a single file.
 */
pc.JSLoader = function()
{
    this.progress = 0;
    this.canvasId = null;
    this.current = 0;
    this.baseUrl = '';
    this.started = false;
    this.finished = false;
    this._noCacheString = '';
    this.gameClass = null;
    this.resources = [];

    /**
     * Tells the resource loader to disable caching in the browser by modifying the resource src
     * by appending the current time
     */
    this.setDisableCache = function ()
    {
        this._noCacheString = '?nocache=' + Date.now();
    };

    this.setBaseUrl = function (url)
    {
        this.baseUrl = url;
    };

    this.makeUrl = function (src)
    {
        return this.baseUrl + src + this._noCacheString;
    };

    this.add = function (src)
    {
        this.resources.push(this.makeUrl(src));
    };

    this.start = function(canvasId, gameClass)
    {
        this.current = 0;
        this.canvasId = canvasId;
        this.gameClass = gameClass;
        this.loadNextScript();
    };

    this.loadNextScript = function()
    {
        var src = this.resources[this.current];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = src;

        script.onload = this.checkAllDone.bind(this);
        script.onerror = function ()
        {
            throw('Could not load javascript file: ' + script.src);
        };

        document.getElementsByTagName("head")[0].appendChild(script);
    };

    this.checkAllDone = function ()
    {
        if (this.resources.length-1 == this.current)
        {
            this.finished = true;
            pc.device.boot(this.canvasId, this.gameClass);
        } else
        {
            this.current++;
            this.loadNextScript();
        }
    }
};

pc.start = function(canvasId, gameClass, gameBaseUrl, scripts)
{
    var loader = new pc.JSLoader();
    loader.setBaseUrl('/playcraftjs/lib/');

    // Externals
    loader.add('ext/jquery171.js');
    loader.add('ext/gamecore.js/src/class.js');
    loader.add('ext/gamecore.js/src/gamecore.js');
    loader.add('ext/gamecore.js/src/jhashtable.js');
    loader.add('ext/gamecore.js/src/device.js');
    loader.add('ext/gamecore.js/src/perf.js');
    loader.add('ext/gamecore.js/src/linkedlist.js');
    loader.add('ext/gamecore.js/src/hashlist.js');
    loader.add('ext/gamecore.js/src/stacktrace.js');
    loader.add('ext/gamecore.js/src/pooled.js');
    loader.add('ext/base64.js');
    loader.add('ext/sylvester.js');
//    loader.add('ext/box2d.2.1a-playcraft.js');
    loader.add('ext/box2dweb.2.1a-pc.js');

    // Playcraft Engine
    loader.add('boot.js'); // <--- must be first for engine scripts (sets up some translations)
    loader.add('input.js');
    loader.add('hashmap.js');
    loader.add('tools.js');
    loader.add('color.js');
    loader.add('debug.js');
    loader.add('device.js');
    loader.add('sound.js');
    loader.add('layer.js');
    loader.add('entity.js');
    loader.add('sprite.js');
    loader.add('spritesheet.js');
    loader.add('math.js');
    loader.add('image.js');
    loader.add('scene.js');
    loader.add('game.js');
    loader.add('loader.js');
    loader.add('dataresource.js');
    loader.add('components/component.js');
    loader.add('components/physics.js');
    loader.add('components/alpha.js');
    loader.add('components/joint.js');
    loader.add('components/expiry.js');
    loader.add('components/originshifter.js');
    loader.add('components/debuginfo.js');
    loader.add('components/spatial.js');
    loader.add('components/overlay.js');
    loader.add('components/clip.js');
    loader.add('components/fade.js');
    loader.add('components/drawing.js');
    loader.add('components/sprite.js');
    loader.add('components/layout.js');
    loader.add('components/particleemitter.js');
    loader.add('systems/system.js');
    loader.add('es/entitymanager.js');
    loader.add('es/systemmanager.js');
    loader.add('systems/entitysystem.js');
    loader.add('systems/physics.js');
    loader.add('systems/effects.js');
    loader.add('systems/particles.js');
    loader.add('systems/expiry.js');
    loader.add('systems/render.js');
    loader.add('systems/layout.js');

    // now load the game scripts
    loader.setBaseUrl(gameBaseUrl);
    for (var i=0; i < scripts.length; i++)
        loader.add(scripts[i]);

    loader.start(canvasId, gameClass);
};
