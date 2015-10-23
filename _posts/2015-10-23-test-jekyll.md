---
title: Here is da post
layout: post
---

Here is *my* page.

First Header  | Second Header
------------- | -------------
Content Cell  | Content Cell
Content Cell  | Content Cell

``` scala
def minus(other: Interval): Set[Interval] = {
    val diffs = if (interval.overlaps(other)) {

      // interval:    |--|--|--|
      //       or: |--|--|--|--|--|
      // i:        |--|--|--|--|--|
      if (
        interval.getStartMillis >= other.getStartMillis &&
        interval.getEndMillis <= other.getEndMillis) {
        Set.empty[Interval] }

      // interval: |--|--|--|--|--|
      // i:           |--|--|--|
      else if (
        interval.getStartMillis < other.getStartMillis &&
        interval.getEndMillis > other.getEndMillis) {
        Set(
          new Interval(interval.getStart, other.getStart),
          new Interval(other.getEnd, interval.getEnd)) }

      // interval: |--|--|--|
      //       or: |--|--|--|--|
      // i:           |--|--|--|
      else if (
        interval.getStartMillis < other.getStartMillis &&
        interval.getEndMillis <= other.getEndMillis)
        Set(new Interval(interval.getStart, other.getStart))

      // interval:    |--|--|--|
      //       or: |--|--|--|--|
      // i:        |--|--|--|
      else if (
        interval.getStartMillis >= other.getStartMillis &&
        interval.getEndMillis > other.getEndMillis)
        Set(new Interval(other.getEnd, interval.getEnd))

      else throw new ClientMessageAwareException(
        s"Unprocessable intervals: $interval and $other")

    } else Set(interval)
    diffs.filterNot(_.toDurationMillis == 0)
  }

  def minus(is: Set[Interval]): Set[Interval] = {
    if (is.exists(_.contains(interval)))
      Set.empty[Interval]
    else if (!is.exists(_.overlaps(interval)))
      Set(interval)
    else {
      val diffs = RichInterval.unionOf(is)
        .foldLeft(Set.empty[Interval])((acc, i) => acc ++ minus(i))
      RichInterval.intersectionOf(diffs)
    }
  }
```
