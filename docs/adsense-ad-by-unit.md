Of course. Here is a comprehensive developer's guide to Google AdSense "By Ad Unit," formatted in Markdown. This document consolidates all the technical details, code examples, customization parameters, and best practices from the provided text, removing UI-specific steps and conversational fluff to create a direct, actionable guide for your developer.

---

# Google AdSense: Developer's Guide to Ad Units

This document provides a comprehensive technical overview for developers implementing and customizing Google AdSense ad units. It covers the different types of ad units, their responsive behavior, customization parameters, advanced implementation techniques, and best practices for performance and user experience.

## Table of Contents

1.  [Introduction to Ad Units](#1-introduction-to-ad-units)
2.  [Global Settings & Optimization](#2-global-settings--optimization)
    - [Ad Size Optimization on Mobile](#ad-size-optimization-on-mobile)
3.  [Display Ads](#3-display-ads)
    - [Key Features of Responsive Display Ads](#key-features-of-responsive-display-ads)
    - [Technical Considerations](#technical-considerations)
    - [Customizing with Ad Tag Parameters](#customizing-with-ad-tag-parameters)
    - [Advanced Customization with CSS](#advanced-customization-with-css)
    - [Fixed-Size Display Ad Units](#fixed-size-display-ad-units)
4.  [Native Ads](#4-native-ads)
    - [In-feed Ads](#in-feed-ads)
    - [In-article Ads](#in-article-ads)
    - [Multiplex Ads](#multiplex-ads)
5.  [AMP & Web Stories Ads](#5-amp--web-stories-ads)
    - [AMP Display Ads](#amp-display-ads)
    - [Web Stories Ads](#web-stories-ads)
6.  [Advanced Topics](#6-advanced-topics)
    - [Hiding Unfilled Ad Units](#hiding-unfilled-ad-units)
    - [Generating Synchronous Ad Code](#generating-synchronous-ad-code)
    - [Search Engine Ad Unit](#search-engine-ad-unit)
7.  [Ad Performance & Best Practices](#7-ad-performance--best-practices)
    - [Ad Types and Revenue](#ad-types-and-revenue)
    - [Better Ads Standards](#better-ads-standards)
    - [Top-Performing Ad Sizes](#top-performing-ad-sizes)
    - [Layout and Viewability](#layout-and-viewability)
    - [Ad Placement](#ad-placement)
    - [Loading Speed](#loading-speed)

---

## 1. Introduction to Ad Units

An ad unit is a piece of AdSense ad code that creates a space on your site for Google ads. This guide focuses on the "By Ad Unit" creation method, which offers fine-grained control over ad placement and appearance.

AdSense offers several types of ad units:

- **Display:** Versatile ads for almost any location. Responsive by default.
- **In-feed:** Native ads that blend into a list of articles or products.
- **In-article:** Native ads designed to fit between paragraphs of content.
- **Multiplex ads:** A grid-based, content-recommendation style native ad unit.
- **Search engine:** A Google-powered search box that displays ads alongside results.

## 2. Global Settings & Optimization

### Ad Size Optimization on Mobile

You can enable a global setting that allows Google to automatically optimize the size of your ad units on mobile devices. This can increase revenue by allowing larger, full-width ads to serve.

- **How it works:** Existing ad units change size based on the user's device context and orientation. No code changes are needed.
- **Preview:** To preview this behavior, add `#google_responsive_slot_preview` to the end of your page's URL and view it on a mobile device or in a browser's device simulator.
- **Limitations:**
  - Only works on mobile-optimized sites and AMP pages.
  - Does not work for iframed ad units (e.g., served via Google Ad Manager).
  - Does not work for ad units within a parent container that has restricted dimensions (e.g., `fixed height`, `overflow: hidden`).

## 3. Display Ads

Display ads are the most common ad format. They are responsive by default, automatically adapting their size to fit your page layout and the user's device.

### Key Features of Responsive Display Ads

- **Automatic Sizing:** The ad code dynamically calculates the required size based on available space.
- **Orientation Change Support:** If a device orientation change alters the page layout, a new, correctly-sized ad is requested.
- **Full-Width on Mobile:** Responsive ad units automatically expand to the full width of the user's screen in portrait mode to increase revenue.

### Technical Considerations

Ensure your responsive ad units work correctly by addressing these common issues:

- **Third-party JavaScript:** If a script hides ad containers until the page loads, the ad code may not calculate the correct size. Use CSS media queries to set the container size in this scenario.
- **Parent Container Has No Width:** If an ad unit is placed in a parent container without an explicit width (e.g., a floating element), the ad code cannot calculate the required size. Set the parent container's width using CSS.
- **Parent Container Has Fixed/Limited Height:** Responsive ads should not be placed in containers with a fixed height, as they may be taller on some devices. Use CSS media queries to manage height if necessary.

### Customizing with Ad Tag Parameters

Modify the behavior of your responsive ad unit by changing parameters in the ad code.

#### Specifying a General Shape (Desktop only)

Change the `data-ad-format` parameter to control the general shape.

- **Default:** `data-ad-format="auto"`
- **Options:**
  - `"rectangle"`
  - `"vertical"`
  - `"horizontal"`
  - Combine values with a comma: `"rectangle,horizontal"`

#### Controlling Full-Width Behavior on Mobile

Use the `data-full-width-responsive` parameter.

- **`data-full-width-responsive="true"` (Recommended):** The ad unit will expand to the full width of the user's screen more frequently, maximizing potential revenue.
- **`data-full-width-responsive="false"`:** Prevents the ad unit from automatically expanding to full width. This may decrease potential earnings.
- **Parameter not present:** The ad unit will still expand in some instances, but less frequently than with `"true"`.

### Advanced Customization with CSS

For precise control over ad sizes at different screen widths, modify the ad code using CSS media queries.

**Important:** When using CSS to control size, you must remove `data-ad-format="auto"` and `data-full-width-responsive="true"` from the `<ins>` tag.

#### Example: Exact Ad Unit Size per Screen Width

This code sets a 320x100 ad for screens up to 500px, 468x60 for 500-799px, and 728x90 for 800px and wider.

```html
<style>
  .custom_ad_unit {
    width: 320px;
    height: 100px;
  }
  @media (min-width: 500px) {
    .custom_ad_unit {
      width: 468px;
      height: 60px;
    }
  }
  @media (min-width: 800px) {
    .custom_ad_unit {
      width: 728px;
      height: 90px;
    }
  }
</style>

<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID"
  crossorigin="anonymous"
></script>
<!-- custom_ad_unit -->
<ins
  class="adsbygoogle custom_ad_unit"
  style="display:block"
  data-ad-client="ca-pub-YOUR_CLIENT_ID"
  data-ad-slot="YOUR_AD_SLOT_ID"
></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

- Replace `custom_ad_unit` with a unique class name for each ad unit.
- Replace `ca-pub-YOUR_CLIENT_ID` and `YOUR_AD_SLOT_ID` with your own values.

#### Hiding an Ad Unit

To prevent an ad from showing on certain screen sizes (e.g., small mobile), use CSS to hide the ad unit. This prevents an ad request from being made.

```css
@media (max-width: 400px) {
  .ad-to-hide {
    display: none;
  }
}
```

### Fixed-Size Display Ad Units

If you require a specific ad size that does not change, you can create a fixed-size ad unit.

- **Policies and Restrictions:**
  - Only one dimension can be greater than 450 pixels.
  - Minimum width: 120 pixels.
  - Minimum height: 50 pixels.
  - Neither dimension can exceed 1200 pixels.

## 4. Native Ads

Native ads are designed to match the look and feel of your site content, providing a better user experience.

### In-feed Ads

These ads are placed within a feed (e.g., a list of articles or products). They are highly customizable to match the surrounding content.

#### Implementation

Place the In-feed ad code inside the HTML of your feed, typically within the loop that generates feed items.

**Pseudo-code Example:**

```php
<?php
$posts = get_posts();
$count = 1;
foreach ($posts as $post) {
    // Insert an ad every 3 posts
    if ($count % 3 == 0) {
        // PASTE YOUR IN-FEED AD CODE HERE
    }

    // Display your content block
    echo '<h3>' . $post->title . '</h3>';
    echo '<p>' . $post->body . '</p>';

    $count++;
}
?>
```

#### Parent Container Requirements

- **Valid Width:** The parent container must have an explicit width set. The minimum width for an In-feed ad is **250px**.
- **Variable Height:** Do not place the ad code in a parent container with a fixed height, as this may distort the ad.

#### Responsive Behavior

- The ad's **width** is always equal to the width of its feed container.
- The ad's **height** is adjusted automatically by AdSense.
- **Font size and padding** are **not** responsive and will remain the same across screen sizes.
- **Image size:** Can be set in pixels (fixed) or percentage (responsive).
- **Text Wrap:** An option can be enabled to allow text to wrap around the image on different screen sizes.

### In-article Ads

Native ads designed to be placed between the paragraphs of your articles. They are optimized by Google for performance.

#### Implementation

Place the ad code within the HTML of your page, ideally two paragraphs below the start of the article.

#### Responsive Behavior

- **Width:** Always equal to the width of the parent container it's inside (min. **250px**).
- **Height:** Automatically adjusted by AdSense.
- **Full-Width on Mobile:** In-article ads automatically expand to the full width of the user's screen in portrait mode.

#### Disabling Full-Width Behavior

To disable the automatic full-width expansion on mobile, add the `data-full-width-responsive="false"` parameter to your In-article ad code. This may decrease potential earnings.

```html
<ins
  class="adsbygoogle"
  style="display:block; text-align:center;"
  data-ad-layout="in-article"
  data-ad-format="fluid"
  data-ad-client="ca-pub-YOUR_CLIENT_ID"
  data-ad-slot="YOUR_AD_SLOT_ID"
  data-full-width-responsive="false"
></ins>
```

### Multiplex Ads

A grid-based native ad format that serves multiple ads in one unit, often used at the end of articles or in sidebars.

#### Customizing Responsive Multiplex Ad Units

You can customize the layout, rows, and columns by adding parameters to the ad code. **Note:** These options are deprecated but may still work.

- `data-matched-content-ui-type`: Controls the layout (e.g., `image_sidebyside`, `image_stacked`, `text`).
- `data-matched-content-rows-num`: Specifies the number of rows.
- `data-matched-content-columns-num`: Specifies the number of columns.

To set different layouts for mobile vs. desktop, provide two comma-separated values (e.g., `data-matched-content-rows-num="4,2"` for 4 rows on mobile and 2 on desktop).

#### Example: 4x1 on Mobile, 2x2 on Desktop

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID"
  crossorigin="anonymous"
></script>
<ins
  class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-YOUR_CLIENT_ID"
  data-ad-slot="YOUR_AD_SLOT_ID"
  data-matched-content-rows-num="4,2"
  data-matched-content-columns-num="1,2"
  data-matched-content-ui-type="image_stacked,image_stacked"
  data-ad-format="autorelaxed"
></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

#### Troubleshooting

- **Blank Ad Unit:** Check that the total number of ads (rows x columns) is between 1 and 30.
- **Fewer Ads Than Expected:** The container may be too narrow. The ad unit will adjust to fit the available space.

## 5. AMP & Web Stories Ads

### AMP Display Ads

AMP pages require a different ad code format.

1.  **Add the script to `<head>`:**
    ```html
    <script
      async
      custom-element="amp-ad"
      src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"
    ></script>
    ```
2.  **Place the ad tag in `<body>`:**
    ```html
    <amp-ad
      width="300"
      height="250"
      type="adsense"
      data-ad-client="ca-pub-YOUR_CLIENT_ID"
      data-ad-slot="YOUR_AD_SLOT_ID"
    >
    </amp-ad>
    ```
    For responsive layouts, use `layout="responsive"`.

### Web Stories Ads

To monetize Web Stories, use the `amp-story-auto-ads` component.

1.  **Add the script to `<head>`:**
    ```html
    <script
      async
      custom-element="amp-story-auto-ads"
      src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"
    ></script>
    ```
2.  **Embed the configuration inside your `<amp-story>` tag:**
    ```html
    <amp-story>
      <amp-story-auto-ads>
        <script type="application/json">
          {
            "ad-attributes": {
              "type": "adsense",
              "data-ad-client": "ca-pub-YOUR_CLIENT_ID",
              "data-ad-slot": "YOUR_AD_SLOT_ID"
            }
          }
        </script>
      </amp-story-auto-ads>
      ... story content ...
    </amp-story>
    ```

## 6. Advanced Topics

### Hiding Unfilled Ad Units

When an ad unit is not filled with an ad, AdSense adds a `data-ad-status` attribute to the `<ins>` element. You can use this to style or hide the container.

- `data-ad-status="filled"`: Ad was returned.
- `data-ad-status="unfilled"`: No ad was returned.

#### Hiding with CSS

```css
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}
```

#### Showing a Backup Image with CSS

```html
<ins
  class="adsbygoogle"
  style="display:inline-block;width:300px;height:250px"
  data-ad-client="ca-pub-YOUR_CLIENT_ID"
  data-ad-slot="YOUR_AD_SLOT_ID"
>
  <a href="/backup-page"><img src="/backup-image.jpg" /></a>
</ins>
```

```css
/* Initially hide the backup content */
ins.adsbygoogle a {
  display: none !important;
}
/* Show the backup content only when the ad is unfilled */
ins.adsbygoogle[data-ad-status="unfilled"] a {
  display: block;
}
```

- **Limitation:** This parameter is only added to ad units in the top window, not in cross-domain iframes.

### Generating Synchronous Ad Code

Asynchronous ad code is standard and recommended. However, if an ad server requires synchronous code, you can modify a **fixed-size** ad unit's code.

**Asynchronous (Default):**

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
></script>
<ins
  class="adsbygoogle"
  style="display:inline-block;width:728px;height:90px"
  data-ad-client="ca-pub-..."
  data-ad-slot="..."
></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Synchronous (Modified):**

```html
<script type="text/javascript">
  google_ad_client = "ca-pub-...";
  google_ad_slot = "...";
  google_ad_width = 728;
  google_ad_height = 90;
</script>
<script
  type="text/javascript"
  src="https://pagead2.googlesyndication.com/pagead/show_ads.js"
></script>
```

### Search Engine Ad Unit

This feature allows you to add a Google search box to your site. When users search, they see ads relevant to their query. Generate the code in the AdSense UI and paste it into your page's `<body>`.

## 7. Ad Performance & Best Practices

### Ad Types and Revenue

- **Native ads, video ads, and rich media display ads** typically garner higher prices.
- **Top-Performing Ad Sizes** tend to have more available inventory and higher bids:
  - Medium Rectangle (300 x 250)
  - Large Rectangle (336 x 280)
  - Leaderboard (728 x 90)
  - Wide Skyscraper (160 x 600)
  - Responsive (sizeless)

### Better Ads Standards

To improve user engagement and avoid penalties, follow these standards:

- Clearly label native ads.
- Mute autoplaying video ads.
- Make pre-roll video ads skippable.
- Avoid pop-up, flashing, or large sticky display ads.
- Avoid ads that force a wait time before they can be closed.

### Layout and Viewability

An ad is "viewable" if at least 50% of it is visible for one second (two for video).

- Place engaging content "above-the-fold."
- Encourage scrolling with teasers for related content.
- Use a responsive layout that fits any screen by setting the viewport.

### Ad Placement

- **Recommended Static Placements (Better Ads Standards):**
  - **Mobile:** Anchored top/bottom banner, static inline.
  - **Desktop:** Long rectangle on the right, static large header, static inline.
- Place ads within articles so they appear as users scroll.
- Avoid placing ads where there is little or no unique content.

### Loading Speed

- Pages should load in less than 3 seconds.
- Use tools like **PageSpeed Insights** and **Lighthouse** to audit and improve ad load speed.
- **Enable lazy loading** for ads and images.
- Use modern image formats like **WebP**.
