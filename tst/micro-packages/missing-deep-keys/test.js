const chai = require('chai');
const expect = chai.expect;

const missingDeepKeys = require('./index');

describe('missing deep keys', function() {
  it('should return empty array for equal objects', function() {
    const o1 = {a: 1};
    const o2 = {a: 1};

    const result = missingDeepKeys(o1, o2);

    expect(result).to.deep.equal([]);
  });

  it('should return array of missing first-level keys', function() {
    const o1 = {a: 1};
    const o2 = {};

    const result = missingDeepKeys(o1, o2);

    expect(result).to.deep.equal(['a']);
  });

  it('should return array of missing deep-level keys', function() {
    const o1 = {a: {b: 2}};
    const o2 = {};

    const result = missingDeepKeys(o1, o2);

    expect(result).to.deep.equal(['a.b']);
  });

  it('should return array of missing intermediate keys', function() {
    const o1 = {a: {b: 2}};
    const o2 = {};

    const result = missingDeepKeys(o1, o2, true);

    expect(result).to.deep.equal(['a', 'a.b']);
  });

  it('should return empty array for non-object arguments', function() {
    const o1 = '';
    const o2 = undefined;

    const result = missingDeepKeys(o1, o2);

    expect(result).to.deep.equal([]);
  });
});
