/* eslint-disable indent */
/* eslint-env mocha */

/* global BigInt */

describe('API', () => {
  const algebra = require('../')

  const R2 = algebra.R2
  const R3 = algebra.R3
  const CompositionAlgebra = algebra.CompositionAlgebra

  const Boole = algebra.Boole
  const Quaternion = algebra.Quaternion
  const Octonion = algebra.Octonion

  describe('About operators', () => {
    it('works', () => {
      const vector1 = new R2([1, 2])
      const vector2 = new R2([3, 4])

      R2.addition(vector1, [3, 4]).should.deepEqual([4, 6])
      R2.addition([1, 2], vector2).should.deepEqual([4, 6])
      R2.addition(vector1, vector2).should.deepEqual([4, 6])

      const vector3 = vector1.addition([3, 4])
      const vector4 = vector1.addition(vector2)
      R2.equality(vector3, vector4).should.be.ok()

      vector1.addition(vector1).equality([2, 4]).should.be.ok()

      vector1.data.should.deepEqual([1, 2])
    })
  })

  describe('CompositionAlgebra', () => {
    const Bit = CompositionAlgebra(Boole)

    it('works', () => {
      Bit.contains(false).should.be.ok()
      Bit.contains(4).should.not.be.ok()

      const bit = new Bit(true)
      bit.addition(false).data.should.eql(true)
    })
  })

  describe('Byte', () => {
    it('is an octonion over binary field', () => {
      const Byte = CompositionAlgebra(Boole, 8)

      const t = true
      const f = false

      const byte1 = new Byte([t, f, f, f, f, f, f, f])
      const byte2 = new Byte([f, t, f, f, f, f, f, f])
      const byte3 = new Byte([f, f, t, f, f, f, f, f])
      const byte4 = new Byte([f, f, f, t, f, f, f, f])
      const byte5 = new Byte([f, f, f, f, t, f, f, f])
      const byte6 = new Byte([f, f, f, f, f, t, f, f])
      const byte7 = new Byte([f, f, f, f, f, f, t, f])
      const byte8 = new Byte([f, f, f, f, f, f, f, t])

      byte1.mul(byte1).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte2.mul(byte2).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte3.mul(byte3).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte4.mul(byte4).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte5.mul(byte5).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte6.mul(byte6).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte7.mul(byte7).data.should.deepEqual([t, f, f, f, f, f, f, f])
      byte8.mul(byte8).data.should.deepEqual([t, f, f, f, f, f, f, f])

      const max = byte1.add(byte2).add(byte3).add(byte4)
                       .add(byte5).add(byte6).add(byte7).add(byte8)

      max.data.should.deepEqual([t, t, t, t, t, t, t, t])
    })
  })

  describe('Scalar', () => {
    function greatCommonDivisor (a, b) {
      if (b === BigInt(0)) {
        return a
      } else {
        return greatCommonDivisor(b, a % b)
      }
    }

    function normalizeRational ([numerator, denominator]) {
      const divisor = greatCommonDivisor(numerator, denominator)

      return denominator > 0 ? (
        [numerator / divisor, denominator / divisor]
      ) : (
        [-numerator / divisor, -denominator / divisor]
      )
    }
})
    

  describe('Real', () => {
    it('works', () => {
      const Real = algebra.Real

      Real.addition(1, 2).should.eql(3)

      const pi = new Real(Math.PI)
      const twoPi = pi.mul(2)

      Real.subtraction(twoPi, 2 * Math.PI).should.eql(0)
    })
  })

  describe('Complex', () => {
    it('works', () => {
      const Complex = algebra.Complex
      const complex1 = new Complex([1, 2])

      complex1.conjugation().data.should.deepEqual([1, -2])
    })
  })

  describe('Quaternion', () => {
    it('works', () => {
      const j = new Quaternion([0, 1, 0, 0])
      const k = new Quaternion([0, 0, 1, 0])

      j.mul(k).equal(k.mul(j).neg()).should.be.ok()
    })
  })

  describe('Octonion', () => {
    it('works', () => {
      const a = new Octonion([0, 1, 0, 0, 0, 0, 0, 0])
      const b = new Octonion([0, 0, 0, 0, 0, 1, 0, 0])
      const c = new Octonion([0, 0, 0, 1, 0, 0, 0, 0])

      const abc1 = a.mul(b.mul(c))
      abc1.data.should.be.deepEqual([0, 0, 0, 0, 0, 0, 0, -1])

      const abc2 = a.mul(b).mul(c)
      abc2.data.should.be.deepEqual([0, 0, 0, 0, 0, 0, 0, 1])

      Octonion.equality(Octonion.negation(abc1), abc2)
    })
  })

  describe('Vector', () => {
    describe('Vector.dimension', () => {
      it('is a static attribute', () => {
        R2.dimension.should.eql(2)
        R3.dimension.should.eql(3)
      })
    })

    describe('vector.dimension', () => {
      it('is an attribute', () => {
        const vector = new R2([1, 1])

        vector.dimension.should.eql(2)
      })
    })

    describe('Vector.norm', () => {
      it('is a static operator', () => {
        R2.norm([3, 4]).data.should.eql(25)
      })
    })

    describe('vector.norm', () => {
      it('is an attribute', () => {
        const vector = new R2([1, 2])

        vector.norm.data.should.eql(5)
      })
    })

    describe('addition', () => {
      it('works', () => {
        R2.addition([2, 1], [1, 2]).should.deepEqual([3, 3])

        const vector1 = new R2([2, 1])
        const vector2 = new R2([2, 2])

        const vector3 = vector1.addition(vector2)

        vector3.data.should.deepEqual([4, 3])
      })
    })

    describe('Cross product', () => {
      it('works', () => {
        R3.crossProduct([3, -3, 1], [4, 9, 2]).should.deepEqual([-15, -2, 39])

        const vector1 = new R3([3, -3, 1])
        const vector2 = new R3([4, 9, 2])

        const vector3 = vector1.crossProduct(vector2)

        vector3.data.should.deepEqual([-15, -2, 39])
      })
    })
  })
})
