Packages taken from [awesome npm packages](https://github.com/parro-it/awesome-micro-npm-packages)

Simple algorithm for automated runs:
1. identify absolute entry point (e.g., index.json)
2. set it as `includes` in both static and dynamic analysis
3. run them and compare results

List of repos are in [clone.sh](./clone.sh).

To run the tests without cloning the repos just run:
```shell
$ ./installNode.sh
$ ./run-check.sh
```
The output log is going to be stored in res.txt
