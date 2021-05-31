#lang racket

(require "../../safe-module.rkt")

(safe-require "collatz.rkt" (patches even? / + in-range stream->list))

(collatz-range 1000)