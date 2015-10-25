---
layout:     post
title:      Pixyll in Action
date:       2014-06-10 12:31:19
summary:    See what the different elements looks like. Your markdown has never looked better. I promise.
categories: jekyll pixyll
---

There is a significant amount of subtle, yet precisely calibrated, styling to ensure
that your content is emphasized while still looking aesthetically pleasing.

All links are easy to [locate and discern](#), yet don't detract from the harmony
of a paragraph. The _same_ goes for italics and __bold__ elements. Even the the strikeout
works if <del>for some reason you need to update your post</del>. For consistency's sake,
<ins>The same goes for insertions</ins>, of course.

### Code, with syntax highlighting

Here's an example of some Scala code with line anchors.

```scala
def stateChange = ComposedAction.async(parse.json) { request =>
  execute {
    val vppList = deserialize[java.util.List[Vpp]](request.body.toString())
    service.stateChange(vppList)
  } map {
    case Success(result) =>
      result match {
        case Right(list) => Ok(serialize(list)) as JSON
        case Left(list) => Status(422) {
          serialize(list)
        }
      }
    case Failure(t) => errors(t)
  }
}
```

{% highlight scala lineanchors %}
package utils

import scala.annotation.tailrec

import models.ClientMessageAwareException
import org.joda.time._
import utils.implicits.richDateTime
import utils.time.TimeIntervalHelper.{PAST_UNBOUNDED => BIG_BANG, FUTURE_UNBOUNDED => END_OF_TIME}

class RichInterval(val interval: Interval) extends AnyRef {

  override def toString: String = interval.toString

  def cancelDSTOffset(
    ref: Interval,
    tz: DateTimeZone,
    exceptHeads: Interval)
  : Interval = {
    val s =
      if (
        interval.getStartMillis != exceptHeads.getStartMillis &&
        interval.getStartMillis != exceptHeads.getEndMillis)
        interval.getStart.cancelDSTDifference(ref.getStart, tz)
      else
        interval.getStart

    val e =
      if (
        interval.getEndMillis != exceptHeads.getStartMillis &&
        interval.getEndMillis != exceptHeads.getEndMillis)
        interval.getEnd.cancelDSTDifference(ref.getEnd, tz)
      else
        interval.getEnd

    if (e.isAfter(s))
      new Interval(s, e)
    else
      interval
  }

  def intersectWith(is: Set[Interval]): Set[Interval] = {
    if (is.nonEmpty) {
      val intersects =
        (for (i <- is) yield Option(interval.overlap(i))).flatten

      if (intersects.nonEmpty)
        RichInterval.unionOf(Set.empty[Interval], intersects)
      else
        intersects
    } else Set.empty[Interval]
  }

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

  def trimWith(dt: DateTime): (Option[Interval], Option[Interval]) = {
    if (interval.contains(dt))
      (Some(new Interval(interval.getStart, dt)).filter(_.toDurationMillis > 0L),
      Some(new Interval(dt, interval.getEnd)).filter(_.toDurationMillis > 0L))
    else
      (Some(interval), None)
  }

  def trimWith(is: Set[Interval]): (Set[Interval], Set[Interval]) =
    (intersectWith(is), minus(is))
}

object RichInterval {
  val orderingByStart = Ordering.by[Interval, Long](_.getStartMillis)

  def apply(i: Interval) = new RichInterval(i)

  def unionOf(is: Set[Interval]): Set[Interval] =
    unionOf(Set.empty[Interval], is)

  @tailrec
  private def unionOf(acc: Set[Interval], is: Set[Interval]): Set[Interval] = {
    val maybeMerges = for (i1 <- is; i2 <- is if i1 != i2) yield {
      val maybeMerge =
        if (Option(i1.gap(i2)).isEmpty) {
          Some(new Interval(
            Math.min(i1.getStartMillis, i2.getStartMillis),
            Math.max(i1.getEndMillis, i2.getEndMillis)))
        } else None
      (maybeMerge, Seq(i1, i2))
    }

    val notOverlapping = is.filterNot(i =>
      maybeMerges.exists(u => u._1.isDefined && u._2.contains(i)))
    val merges = maybeMerges.flatMap(_._1)

    val accUpdated = acc ++ notOverlapping
    if (merges.nonEmpty)
      unionOf(accUpdated, merges)
    else
      accUpdated
  }

  @tailrec
  private def intersectionOf(
    is: Set[Interval])
  : Set[Interval] = {

    val intersects =
      (for (i1 <- is; i2 <- is if i1 != i2)
        yield Option(i1.overlap(i2))).flatten

    if (intersects.isEmpty)
        unionOf(Set.empty[Interval], is)
    else
      intersectionOf(intersects)
  }

  def spanOf(is: Set[Interval]): Interval = {
    if (is.nonEmpty) new Interval(
      new DateTime(is.minBy(_.getStartMillis).getStart),
      new DateTime(is.maxBy(_.getEndMillis).getEnd))
    else new Interval(new DateTime(END_OF_TIME), new DateTime(BIG_BANG))
  }
}
{% endhighlight %}

Here's an example of some ruby code with line anchors.

{% highlight ruby lineanchors %}
# The most awesome of classes
class Awesome < ActiveRecord::Base
  include EvenMoreAwesome

  validates_presence_of :something
  validates :email, email_format: true

  def initialize(email, name = nil)
    self.email = email
    self.name = name
    self.favorite_number = 12
    puts 'created awesomeness'
  end

  def email_format
    email =~ /\S+@\S+\.\S+/
  end
end
{% endhighlight %}

Here's some CSS:

{% highlight css %}
.foobar {
  /* Named colors rule */
  color: tomato;
}
{% endhighlight %}

Here's some JavaScript:

{% highlight js %}
var isPresent = require('is-present')

module.exports = function doStuff(things) {
  if (isPresent(things)) {
    doOtherStuff(things)
  }
}
{% endhighlight %}

Here's some HTML:

{% highlight html %}
<div class="m0 p0 bg-blue white">
  <h3 class="h1">Hello, world!</h3>
</div>
{% endhighlight %}

# Headings!

They're responsive, and well-proportioned (in `padding`, `line-height`, `margin`, and `font-size`).
They also heavily rely on the awesome utility, [BASSCSS](http://www.basscss.com/).

##### They draw the perfect amount of attention

This allows your content to have the proper informational and contextual hierarchy. Yay.

### There are lists, too

  * Apples
  * Oranges
  * Potatoes
  * Milk

  1. Mow the lawn
  2. Feed the dog
  3. Dance

### Images look great, too

![desk](https://cloud.githubusercontent.com/assets/1424573/3378137/abac6d7c-fbe6-11e3-8e09-55745b6a8176.png)

_![desk](https://cloud.githubusercontent.com/assets/1424573/3378137/abac6d7c-fbe6-11e3-8e09-55745b6a8176.png)_


### There are also pretty colors

Also the result of [BASSCSS](http://www.basscss.com/), you can <span class="bg-dark-gray white">highlight</span> certain components
of a <span class="red">post</span> <span class="mid-gray">with</span> <span class="green">CSS</span> <span class="orange">classes</span>.

I don't recommend using blue, though. It looks like a <span class="blue">link</span>.

### Stylish blockquotes included

You can use the markdown quote syntax, `>` for simple quotes.

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse quis porta mauris.

However, you need to inject html if you'd like a citation footer. I will be working on a way to
hopefully sidestep this inconvenience.

<blockquote>
  <p>
    Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.
  </p>
  <footer><cite title="Antoine de Saint-Exupéry">Antoine de Saint-Exupéry</cite></footer>
</blockquote>

### There's more being added all the time

Checkout the [Github repository](https://github.com/johnotander/pixyll) to request,
or add, features.

Happy writing.
