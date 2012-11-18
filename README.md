A simple pair of rabbitmq apps meant to run on Cloud Foundry.  The producer sends messages to the consumer. And the consumer uses websockets to synchronously display messages to the client.

This is the source code for the UBC CS Alumni lecture: [What is this Cloud Thing?](https://www.cs.ubc.ca/event/2012/11/alumni-lecture-andrew-eisenberg-what-cloud-thing)

This code comes with two apps, rabbit-producer and rabbit-consumer.  These applications each run a simple node server to and communicate using [rabbitmq](http://www.rabbitmq.com/).

To run:

1. register for an account at http://cloudfoundry.com
2. get the [vmc command line tool](http://docs.cloudfoundry.com/tools/vmc/installing-vmc.html)
3. vmc target http://api.cloudfoundry.com
4. vmc login (your user name and passwprd)
5. cd rabbit-producer
6. vmc push rabbit-producer --runtime node08  (choose your own name)
7. Use the default options and bind a rabbitmq service
8. cd ../rabbit-consumer
6. vmc push rabbit-consumer --runtime node08  (choose your own name)
7. Use the default options and bind to the same rabbitmq service defined in step 7

You should now have 2 node server running on cloud foundry.  You can send messages from the producer to the consumer.