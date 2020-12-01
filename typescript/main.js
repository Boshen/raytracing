var Vector = /** @class */ (function () {
    function Vector(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector.prototype.length = function () {
        return Math.sqrt(this.dot(this));
    };
    Vector.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    Vector.prototype.add = function (v) {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    Vector.prototype.translate = function (n) {
        return new Vector(this.x + n, this.y + n, this.z + n);
    };
    Vector.prototype.sub = function (v) {
        return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    Vector.prototype.scale = function (p) {
        return new Vector(p * this.x, p * this.y, p * this.z);
    };
    Vector.prototype.cross = function (v) {
        return new Vector((this.y * v.z) - (this.z * v.y), (this.z * v.x) - (this.x * v.z), (this.x * v.y) - (this.y * v.x));
    };
    Vector.prototype.unit = function () {
        return this.scale(1 / this.length());
    };
    Vector.prototype.toString = function () {
        return "[" + this.x + ", " + this.y + ", " + this.z + "]";
    };
    return Vector;
}());
var Line = /** @class */ (function () {
    function Line(origin, line) {
        this.origin = origin;
        this.line = line;
    }
    Line.prototype.getPoint = function (distance) {
        return this.origin.add(this.line.scale(distance));
    };
    Line.prototype.toString = function () {
        return "origin: " + this.origin + ", line: " + this.line;
    };
    return Line;
}());
var Light = /** @class */ (function () {
    function Light(source, illumination) {
        this.source = source;
        this.illumination = illumination;
    }
    return Light;
}());
var Sphere = /** @class */ (function () {
    function Sphere(radius, center, color, lambert, ambient, specular) {
        if (lambert === void 0) { lambert = 0.7; }
        if (ambient === void 0) { ambient = 0.1; }
        if (specular === void 0) { specular = 0.2; }
        this.radius = radius;
        this.center = center;
        this.color = color;
        this.lambert = lambert;
        this.ambient = ambient;
        this.specular = specular;
    }
    Sphere.prototype.normal = function (p) {
        return p.sub(this.center);
    };
    Sphere.prototype.intersection = function (ray) {
        // (-b +- sqrt(b^2 - a*c)) / a
        var originToCenter = ray.origin.sub(this.center);
        // const a = ray.line.dot(ray.line) === 1
        var b = ray.line.dot(originToCenter);
        var c = originToCenter.dot(originToCenter);
        var d = Math.pow(b, 2) - c + Math.pow(this.radius, 2); // discriminant
        if (d <= 0) {
            return Infinity;
        }
        else {
            var sqrtD = Math.sqrt(d);
            var root1 = -b + sqrtD;
            var root2 = -b - sqrtD;
            return Math.min.apply(null, [root1, root2].filter(function (x) { return x >= 0; }));
        }
    };
    return Sphere;
}());
var Canvas = /** @class */ (function () {
    function Canvas(width, height) {
        this.width = width;
        this.height = height;
        this.imageData = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
    }
    Canvas.prototype.addPixel = function (i, j, color) {
        var r = Math.round(color.x);
        var g = Math.round(color.y);
        var b = Math.round(color.z);
        var index = (j * this.width + i) * 4;
        this.imageData[index + 0] = r;
        this.imageData[index + 1] = g;
        this.imageData[index + 2] = b;
        this.imageData[index + 3] = 255;
    };
    Canvas.prototype.render = function () {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        var imageData = new ImageData(new Uint8ClampedArray(this.imageData), this.width, this.height);
        this.ctx.putImageData(imageData, 0, 0);
    };
    return Canvas;
}());
var main = function () {
    var width = 500;
    var height = 500;
    var eye = new Vector(0, 0, -150);
    var lights = [
        new Light(new Vector(0, 1000, 0), 1000),
        new Light(new Vector(1000, 0, 0), 1000)
    ];
    var background = new Vector(0, 0, 0);
    // u-v-w coordinate from the eye
    var u = new Vector(1, 0, 0);
    var v = new Vector(0, 1, 0);
    var w = new Vector(0, 0, 1);
    var spheres = [
        new Sphere(30, new Vector(0, 0, 0), new Vector(255, 0, 0)),
        new Sphere(10, new Vector(0, 50, -10), new Vector(0, 255, 0)),
        new Sphere(5, new Vector(60, 0, -10), new Vector(0, 0, 255))
    ];
    var canvas = new Canvas(width, height);
    function trace(ray, depth, object) {
        if (depth > 3) {
            return new Vector(0, 0, 0);
        }
        // trace ray from eye to objects
        var minD = Infinity;
        spheres.forEach(function (sphere) {
            var d = sphere.intersection(ray);
            if (d < minD) {
                minD = d;
                object = sphere;
            }
        });
        // no object has been found
        if (minD === Infinity) {
            return null;
        }
        var point = ray.getPoint(minD);
        return hit(ray, point, object, depth);
    }
    function hit(ray, point, object, depth) {
        var normal = object.normal(point).unit();
        var lambert = 0;
        for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
            var light = lights_1[_i];
            // compute shadow
            // trace ray from intersection point to light source
            // add an offset so shadow ray will not intersect with the origin object itself
            var minD = Infinity;
            var shadowDirection = light.source.sub(point).unit();
            var shadowRay = new Line(point.add(shadowDirection.scale(0.001)), shadowDirection);
            for (var _a = 0, spheres_1 = spheres; _a < spheres_1.length; _a++) {
                var sphere = spheres_1[_a];
                var d = sphere.intersection(shadowRay);
                if (d < minD) {
                    minD = d;
                    break;
                }
            }
            if (minD !== Infinity) {
                continue;
            }
            // compute lambertian shading
            var l = light.source.sub(point).unit();
            lambert += Math.max(0, normal.dot(l));
        }
        // compute specular shading
        var r = ray.line.sub(normal.scale(2).scale(normal.dot(ray.line)));
        var color = trace(new Line(point.add(r.scale(0.001)), r), depth + 1);
        var c = color ? color.scale(object.specular) : new Vector(0, 0, 0);
        return c
            .add(object.color.scale(Math.min(1, lambert) * object.lambert))
            .add(object.color.scale(object.ambient));
    }
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            // transformed pixel position
            var us = (i - width / 2) / width;
            var vs = (height / 2 - j) / height;
            // eye -> line direction vector
            var s = (u.scale(us)).add(v.scale(vs)).add(w).unit();
            var ray = new Line(eye, s);
            var color = trace(ray, 0) || background;
            canvas.addPixel(i, j, color);
        }
    }
    canvas.render();
};
main();
