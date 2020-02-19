# Lya
Module-aware Fracture and Recombination for Dynamic Analysis


## More Resources on the Membrane Pattern

https://code.google.com/archive/p/es-lab/#Script_Compartments

https://tvcutsem.github.io/js-membranes

https://github.com/ajvincent/es-membrane

https://github.com/salesforce/observable-membrane


## De-bloating


The two "bloated" functions..
```javascript
function bloated1(a, b) {
  doA(a);
  doB();
  for (i = 0; i < 3; i++) {
    doC(i)
  }
  doA();
  doB();
}

function bloated2(a, b) {
  doA(a);
  doB();
  for (i = 0; i < 300; i++) {
    doC(i)
  }
  doX()
}
```

...can be converted to:

```javascript
function template(a, b, limit, custom) {
  doA(a);
  doB();
  for (i = 0; i < limit; i++) {
    doC(i)
  }
  custom()
}

template(a, b, 3, () => {doA(); doB();})
template(a, b, 300, () => {doX();})
```
