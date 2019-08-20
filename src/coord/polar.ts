/**
 * @fileOverview the class of Polar Coordinate
 * @author sima.zhang
 */
import { mat3, vec2, vec3 } from '@antv/matrix-util';
import { isNumberEqual } from '@antv/util';
import { CoordCfg, PointType } from '../interface';
import Coord from './base';

export default class Polar extends Coord {
  public type: string = 'polar';
  public isPolar: boolean = true;
  public endAngle: number;
  public radius: number;
  public x: any;
  public y: any;
  public circleCenter: PointType;
  constructor(cfg: CoordCfg) {
    super({
      startAngle: -Math.PI / 2,
      endAngle: (Math.PI * 3) / 2,
      innerRadius: 0,
      ...cfg,
    });
    this._init();
  }

  public _init() {
    let radius = this.radius;
    const innerRadius = this.innerRadius;
    const center = this.center;
    const startAngle = this.startAngle;
    let endAngle = this.endAngle;
    while (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    this.endAngle = endAngle;
    const oneBox = this.getOneBox();

    const oneWidth = oneBox.maxX - oneBox.minX;
    const oneHeight = oneBox.maxY - oneBox.minY;
    const left = Math.abs(oneBox.minX) / oneWidth;
    const top = Math.abs(oneBox.minY) / oneHeight;
    const width = this.width;
    const height = this.height;
    let maxRadius: number;
    let circleCenter: PointType;
    if (height / oneHeight > width / oneWidth) {
      // width为主
      maxRadius = width / oneWidth;
      circleCenter = {
        x: center.x - (0.5 - left) * width,
        y: center.y - (0.5 - top) * maxRadius * oneHeight,
      };
    } else {
      // height为主
      maxRadius = height / oneHeight;
      circleCenter = {
        x: center.x - (0.5 - left) * maxRadius * oneWidth,
        y: center.y - (0.5 - top) * height,
      };
    }

    if (!radius) {
      radius = maxRadius;
    } else if (radius > 0 && radius <= 1) {
      radius = maxRadius * radius;
    } else if (radius <= 0 || radius > maxRadius) {
      radius = maxRadius;
    }

    const x = {
      start: startAngle,
      end: endAngle,
    };

    const y = {
      start: innerRadius * radius,
      end: radius,
    };

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.circleCenter = circleCenter;
  }

  public getCenter() {
    return this.circleCenter;
  }

  public getOneBox() {
    const startAngle = this.startAngle;
    const endAngle = this.endAngle;
    if (Math.abs(endAngle - startAngle) >= Math.PI * 2) {
      return {
        minX: -1,
        maxX: 1,
        minY: -1,
        maxY: 1,
      };
    }
    const xs = [0, Math.cos(startAngle), Math.cos(endAngle)];
    const ys = [0, Math.sin(startAngle), Math.sin(endAngle)];

    for (let i = Math.min(startAngle, endAngle); i < Math.max(startAngle, endAngle); i += Math.PI / 18) {
      xs.push(Math.cos(i));
      ys.push(Math.sin(i));
    }

    return {
      minX: Math.min.apply(Math, xs),
      maxX: Math.max.apply(Math, xs),
      minY: Math.min.apply(Math, ys),
      maxY: Math.max.apply(Math, ys),
    };
  }

  public getRadius() {
    return this.radius;
  }

  public convertPoint(point: PointType) {
    const center = this.getCenter();
    let x = this.isTransposed ? point.y : point.x;
    let y = this.isTransposed ? point.x : point.y;

    x = this.convertDim(x, 'x');
    y = this.convertDim(y, 'y');

    return {
      x: center.x + Math.cos(x) * y,
      y: center.y + Math.sin(x) * y,
    };
  }

  public invertPoint(point: PointType) {
    const center = this.getCenter();
    const vPoint = [point.x - center.x, point.y - center.y];
    const x = this.x;
    const m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    mat3.rotate(m, m, x.start);

    let vStart = [1, 0, 0];
    vec3.transformMat3(vStart, vStart, m);
    vStart = [vStart[0], vStart[1]];
    let angle = vec2.angleTo(vStart, vPoint, x.end < x.start);
    if (isNumberEqual(angle, Math.PI * 2)) {
      angle = 0;
    }
    const radius = vec2.length(vPoint);

    let xPercent = angle / (x.end - x.start);
    xPercent = x.end - x.start > 0 ? xPercent : -xPercent;

    const yPercent = this.invertDim(radius, 'y');
    const rst = { x: 0, y: 0 };
    rst.x = this.isTransposed ? yPercent : xPercent;
    rst.y = this.isTransposed ? xPercent : yPercent;
    return rst;
  }
}