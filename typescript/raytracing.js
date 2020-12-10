var Vec3 = /** @class */ (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vec3.prototype.length = function () {
        return Math.sqrt(this.dot(this));
    };
    Vec3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    Vec3.prototype.add = function (v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    Vec3.prototype.translate = function (n) {
        return new Vec3(this.x + n, this.y + n, this.z + n);
    };
    Vec3.prototype.sub = function (v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    Vec3.prototype.scale = function (p) {
        return new Vec3(p * this.x, p * this.y, p * this.z);
    };
    Vec3.prototype.mul = function (p) {
        return new Vec3(p.x * this.x, p.y * this.y, p.z * this.z);
    };
    Vec3.prototype.cross = function (v) {
        return new Vec3((this.y * v.z) - (this.z * v.y), (this.z * v.x) - (this.x * v.z), (this.x * v.y) - (this.y * v.x));
    };
    Vec3.prototype.unit = function () {
        return this.scale(1 / this.length());
    };
    Vec3.prototype.distance = function (v) {
        var x = v.x - this.x;
        var y = v.y - this.y;
        var z = v.z - this.z;
        return Math.sqrt(x * x + y * y + z * z);
    };
    return Vec3;
}());
var Matrix = /** @class */ (function () {
    function Matrix(values) {
        this.values = values;
    }
    Matrix.prototype.inverse = function () {
        var _a = this.values, a00 = _a[0], a01 = _a[1], a02 = _a[2], a10 = _a[3], a11 = _a[4], a12 = _a[5], a20 = _a[6], a21 = _a[7], a22 = _a[8];
        var det01 = a22 * a11 - a12 * a21;
        var det11 = -a22 * a10 + a12 * a20;
        var det21 = a21 * a10 - a11 * a20;
        var det = a00 * det01 + a01 * det11 + a02 * det21;
        if (!det) {
            return null;
        }
        det = 1.0 / det;
        var values = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        values[0] = det01 * det;
        values[1] = (-a22 * a01 + a02 * a21) * det;
        values[2] = (a12 * a01 - a02 * a11) * det;
        values[3] = det11 * det;
        values[4] = (a22 * a00 - a02 * a20) * det;
        values[5] = (-a12 * a00 + a02 * a10) * det;
        values[6] = det21 * det;
        values[7] = (-a21 * a00 + a01 * a20) * det;
        values[8] = (a11 * a00 - a01 * a10) * det;
        return new Matrix(values);
    };
    Matrix.prototype.multiplyVec3 = function (vector) {
        var x = vector.x;
        var y = vector.y;
        var z = vector.z;
        return new Vec3(x * this.values[0] + y * this.values[3] + z * this.values[6], x * this.values[1] + y * this.values[4] + z * this.values[7], x * this.values[2] + y * this.values[5] + z * this.values[8]);
    };
    return Matrix;
}());
var Ray = /** @class */ (function () {
    function Ray(start, direction) {
        this.start = start;
        this.direction = direction;
    }
    Ray.prototype.getPoint = function (distance) {
        return this.start.add(this.direction.scale(distance));
    };
    return Ray;
}());
var Triangle = /** @class */ (function () {
    function Triangle(v0, v1, v2, 
    // public normal: Vec3,
    color) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.color = color;
    }
    // public intersects(ray: Ray) {
    // const v0 = this.v0;
    // const v1 = this.v1;
    // const v2 = this.v2;
    // const e1 = v1.sub(v0);
    // const e2 = v2.sub(v0);
    // const b = ray.start.sub(v0);
    // const d = ray.direction
    // const A = new Matrix([
    // -d.x, -d.y, -d.z,
    // e1.x, e1.y, e1.z,
    // e2.x, e2.y, e2.z
    // ])
    // const inverse = A.inverse()
    // return inverse && inverse.multiplyVec3(b);
    // }
    // Möller–Trumbore intersection algorithm
    Triangle.prototype.intersects = function (ray) {
        var EPSILON = 0.000001;
        var e1 = this.v1.sub(this.v0);
        var e2 = this.v2.sub(this.v0);
        var h = ray.direction.cross(e2);
        var a = e1.dot(h);
        if (a > -EPSILON && a < EPSILON) {
            return null;
        }
        var f = 1 / a;
        var s = ray.start.sub(this.v0);
        var u = f * s.dot(h);
        if (u < 0 || u > 1) {
            return null;
        }
        var q = s.cross(e1);
        var v = f * ray.direction.dot(q);
        if (v < 0 || u + v > 1) {
            return null;
        }
        var t = f * e2.dot(q);
        if (t > EPSILON) {
            return {
                ray: ray,
                point: ray.getPoint(t),
                distance: t
            };
        }
        return null;
    };
    Triangle.prototype.scale = function (L) {
        this.v0 = this.v0.scale(2 / L);
        this.v1 = this.v1.scale(2 / L);
        this.v2 = this.v2.scale(2 / L);
        this.v0 = this.v0.sub(new Vec3(1, 1, 1));
        this.v1 = this.v1.sub(new Vec3(1, 1, 1));
        this.v2 = this.v2.sub(new Vec3(1, 1, 1));
        this.v0.x = this.v0.x * -1;
        this.v1.x = this.v1.x * -1;
        this.v2.x = this.v2.x * -1;
        this.v0.y = this.v0.y * -1;
        this.v1.y = this.v1.y * -1;
        this.v2.y = this.v2.y * -1;
    };
    return Triangle;
}());
var Canvas = /** @class */ (function () {
    function Canvas(width, height) {
        this.width = width;
        this.height = height;
        this.imageData = [];
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        for (var i = 0; i < width; i++) {
            for (var j = 0; j < height; j++) {
                this.addPixel(i, j, new Vec3(0, 0, 0));
            }
        }
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
        var imageData = new ImageData(new Uint8ClampedArray(this.imageData), this.width, this.height);
        this.ctx.putImageData(imageData, 0, 0);
    };
    return Canvas;
}());
var camera = new Vec3(0, 0, -3);
var viewDistance = 500;
var width = 500;
var height = 500;
var focalLength = width;
var L = 555;
var z_front = 0; // -L
var red = new Vec3(0.75, 0.15, 0.15);
var white = new Vec3(0.75, 0.75, 0.75);
var beige = new Vec3(0.85, 0.85, 0.7);
var blue = new Vec3(0.05, 0.6, 1);
var green = new Vec3(0.15, 0.75, 0.15);
var A = new Vec3(L, 0, z_front);
var B = new Vec3(0, 0, z_front);
var C = new Vec3(L, 0, L);
var D = new Vec3(0, 0, L);
var E = new Vec3(L, L, z_front);
var F = new Vec3(0, L, z_front);
var G = new Vec3(L, L, L);
var H = new Vec3(0, L, L);
var triangles = [
    // floor
    new Triangle(C, B, A, beige),
    new Triangle(C, D, B, beige),
    // left
    new Triangle(A, E, C, green),
    new Triangle(C, E, G, green),
    // right
    new Triangle(F, B, D, blue),
    new Triangle(H, F, D, blue),
    // front wall
    new Triangle(G, D, C, beige),
    new Triangle(G, H, D, beige),
    // ceiling
    new Triangle(E, F, G, beige),
    new Triangle(F, H, G, beige),
];
triangles.forEach(function (o) { return o.scale(L); });
var canvas = new Canvas(width, height);
for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
        var x = i - width / 2;
        var y = j - height / 2;
        var d = new Vec3(x, y, focalLength).unit();
        // const d = uu.scale(x)
        // .add(vv.scale(y))
        // .sub(ww.scale(viewDistance))
        // .unit()
        var ray = new Ray(camera, d);
        var minDistance = Infinity;
        var hitItem = null;
        for (var _i = 0, triangles_1 = triangles; _i < triangles_1.length; _i++) {
            var item = triangles_1[_i];
            var int = item.intersects(ray);
            if (int && int.distance < minDistance) {
                minDistance = int.distance;
                hitItem = item;
            }
        }
        if (hitItem) {
            canvas.addPixel(i, j, hitItem.color.scale(255));
        }
    }
}
canvas.render();
