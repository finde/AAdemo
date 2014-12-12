# Autonomous Agents 1

UvA Autonomous Agents 1 - Assignments Fall 2014

## Source

[The assignment](http://blackboard.uva.nl/bbcswebdav/pid-5199313-dt-content-rid-6850244_1/courses/2318N001.52041AUA6Y.S1.1.2014/aa_assignments.pdf)

[Reinforcement Learning: An Introduction](http://webdocs.cs.ualberta.ca/~sutton/book/ebook/the-book.html)

## Short description

This project basically consist of three parts:

1. Single Agent Planning

  * Random Policy
  
  * Policy Evaluation
  
  * Policy Iteration
  
  * Value Iteration
  
2. Single Agent Learning

  * QLearning
  
  * SARSA
  
  * Off-policy Monte Carlo
  
  * On-policy Monte Carlo
  
3. Multi Agents Planning/Learning

  * Multi-agents Random Policy
  
  * Independent QLearning
  
  * MinimaxQ
 
## Installation guide

1. Install [nodeJS](http://nodejs.org/), [Ruby](https://www.ruby-lang.org/en/), and [Sass](https://www.ruby-lang.org/en/)

2. Install globally [Sails](http://sailsjs.org/#/), [Grunt](http://gruntjs.com/), [Bower](http://bower.io/), and [Mocha](http://mochajs.org/) via npm
    
    `$ npm install -g sails grunt bower mocha`

3. Clone this repository, and go to project root folder

4. Install dependencies
    
    `$ npm install`
    
    `$ bower install`
    
5. Run compile the frontend framework using grunt basic
    
    `$ grunt basic`
    
6. If everything is good, then run the sails
    
    `$ sails lift`
    
7. (Optional) Alternatively you can also run the mocha
    
    `$ mocha`
    
  
## TODO:

* Fixed single-agent planning: currently the single agent planning is not completely working due after migration to nodeJS code style.

* Code documentation: more comments

* Code clean up: remove old codes, follow jsHint style guide.

* Optimization: make it fast, fast, fast... whooosss

* Redesign the interface

* Gulp integration
 
* Fork lp_solve as separate repository, currently we hack it from the node_modules

* Add unit test

## Honorable contributors:

* [arifqodari](https://github.com/arifqodari)

* [L0ft3r](https://github.com/l0ft3r)

## Finde's side-notes:
This project is very far from completion (see the todo-list..) :)
The code is always evolving.
So, if there is anyone else interesting to improve the system, feel free to do pull-request.
I will try to complete this project on my own free time.
I also want to implement more algorithms (not only from the assignments), so in the future I can use it for a reference :)
