#!/bin/bash

# By default we table all results, but can narrow down to one directory

TEST_DIR=${1:-tests}

TESTS=$(find $TEST_DIR -name key-metrics.json)

# Table specification, heading and json path

TABLE_SPEC="\
ConcurrentUsers:.config.concurrency
CPUPerRequest:.result.cpuTimePerRequest
TotalRequests:.config.totalRequests
Cache:.config.nodeDBCache
PeersIn:.config.nodePeersIn
PeersOut:.config.nodePeersOut
"

echo -n "TestID;"
for ITEM in $TABLE_SPEC; do
  echo -n $(echo $ITEM | cut -d: -f1)\;
done
echo -n "TestType;"
echo

# We print the header

for TEST in $TESTS; do

  TEST_FOLDER=$(dirname $TEST)
  TEST_ID=$(basename $TEST_FOLDER)
  TEST_TYPE=$(dirname $TEST_FOLDER)

  echo -n "$TEST_ID;"
  for ITEM in $TABLE_SPEC; do
    JPATH=$(echo $ITEM | cut -d: -f2)
    JVALUE=$(cat $TEST | jq $JPATH)
    echo -n "$JVALUE;" 
  done
  echo -n "$TEST_TYPE;"
  echo
done
 
