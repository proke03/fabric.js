// @ts-nocheck
import { iMatrix } from '../constants';
import { commaWsp, reNum } from './constants';
import { multiplyTransformMatrices } from '../util/misc/matrix';
import { degreesToRadians } from '../util/misc/radiansDegreesConversion';
import { rotateMatrix } from './rotateMatrix';
import { scaleMatrix } from './scaleMatrix';
import { skewMatrix } from './skewMatrix';
import { translateMatrix } from './translateMatrix';
import { TMat2D } from '../typedefs';

// == begin transform regexp
const number = reNum,
  skewX = '(?:(skewX)\\s*\\(\\s*(' + number + ')\\s*\\))',
  skewY = '(?:(skewY)\\s*\\(\\s*(' + number + ')\\s*\\))',
  rotate =
    '(?:(rotate)\\s*\\(\\s*(' +
    number +
    ')(?:' +
    commaWsp +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    '))?\\s*\\))',
  scale =
    '(?:(scale)\\s*\\(\\s*(' +
    number +
    ')(?:' +
    commaWsp +
    '(' +
    number +
    '))?\\s*\\))',
  translate =
    '(?:(translate)\\s*\\(\\s*(' +
    number +
    ')(?:' +
    commaWsp +
    '(' +
    number +
    '))?\\s*\\))',
  matrix =
    '(?:(matrix)\\s*\\(\\s*' +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    ')' +
    commaWsp +
    '(' +
    number +
    ')' +
    '\\s*\\))',
  transform =
    '(?:' +
    matrix +
    '|' +
    translate +
    '|' +
    scale +
    '|' +
    rotate +
    '|' +
    skewX +
    '|' +
    skewY +
    ')',
  transforms =
    '(?:' + transform + '(?:' + commaWsp + '*' + transform + ')*' + ')',
  transformList = '^\\s*(?:' + transforms + '?)\\s*$',
  // http://www.w3.org/TR/SVG/coords.html#TransformAttribute
  reTransformList = new RegExp(transformList),
  // == end transform regexp
  reTransform = new RegExp(transform, 'g');

/**
 * Parses "transform" attribute, returning an array of values
 * @param {String} attributeValue String containing attribute value
 * @return {TMat2D} transformation matrix
 */
export function parseTransformAttribute(attributeValue: string) {
  // start with identity matrix
  let matrix = iMatrix.concat() as TMat2D;
  const matrices: TMat2D[] = [];

  // return if no argument was given or
  // an argument does not match transform attribute regexp
  if (
    !attributeValue ||
    (attributeValue && !reTransformList.test(attributeValue))
  ) {
    return matrix;
  }

  attributeValue.replace(reTransform, (match) => {
    const m = new RegExp(transform).exec(match)!.filter(
        (match) =>
          // match !== '' && match != null
          !!match
      ),
      operation = m[1],
      args = m.slice(2).map(parseFloat);

    switch (operation) {
      case 'translate':
        translateMatrix(matrix, args);
        break;
      case 'rotate':
        args[0] = degreesToRadians(args[0]);
        rotateMatrix(matrix, args);
        break;
      case 'scale':
        scaleMatrix(matrix, args);
        break;
      case 'skewX':
        skewMatrix(matrix, args, 2);
        break;
      case 'skewY':
        skewMatrix(matrix, args, 1);
        break;
      case 'matrix':
        matrix = args as TMat2D;
        break;
    }

    // snapshot current matrix into matrices array
    matrices.push(matrix.concat() as TMat2D);
    // reset
    matrix = iMatrix.concat() as TMat2D;
  });

  let combinedMatrix = matrices[0];
  while (matrices.length > 1) {
    matrices.shift();
    combinedMatrix = multiplyTransformMatrices(combinedMatrix, matrices[0]);
  }
  return combinedMatrix;
}
