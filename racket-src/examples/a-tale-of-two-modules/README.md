# A tale of two modules

In this example, we have two modules, A and B.
A is naughty: it does IO. B is being required, and it in turn
requires B. Our code should detect and stop this from happening.

