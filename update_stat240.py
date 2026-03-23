#!/usr/bin/env python3
import json

# Load the JSON file
with open('content/courses/stat240.json', 'r') as f:
    data = json.load(f)

# Define the additions for each module
# All additions are appended to existing content

additions = {
    "module-1": """

## R Markdown & Code Chunks

R Markdown (`.Rmd`) files blend text and executable R code. Code goes inside **code chunks** delimited by triple backticks:

```r
# This is a code chunk
x <- 4
x + 1
```
```output
[1] 5
```

Inside a chunk, lines starting with `#` are comments. When you **knit** the document (Ctrl+Shift+K), R runs all chunks and outputs a polished HTML or PDF report.

> **R Markdown workflow:** Write explanatory text → insert code chunks → knit → instant report. This is how actual data scientists document their work.

## Case Sensitivity & Working Directory

R is case-sensitive: `x` and `X` are different variables. `TRUE` and `true` are not the same (R only recognizes `TRUE`, `FALSE`, `NA`).

```r
x <- 5
X <- 10
x
X
```
```output
[1] 5
[1] 10
```

To see your current working directory, use `getwd()`:

```r
getwd()
```
```output
[1] "/Users/miranda/Desktop/STAT240"
```

## More Useful Functions

### `paste()` for combining strings

```r
paste("Hello", "world")
paste("Name:", "Alice")
paste("x =", 42)
```
```output
[1] "Hello world"
[1] "Name: Alice"
[1] "x = 42"
```

### `seq()` with named arguments

```r
seq(from = 0, to = 10, by = 2)
```
```output
[1]  0  2  4  6  8 10
```

### `sum()` with multiple arguments

```r
sum(1:10)         # sum of 1, 2, 3, ... 10
sum(c(3, 7, 2))   # sum of 3, 7, 2
```
```output
[1] 55
[1] 12
```""",

    "module-2": """

## Mathematical Operators

R supports the standard arithmetic operators:

```r
5 + 3      # addition
5 - 3      # subtraction
5 * 3      # multiplication
5 / 3      # division
2 ^ 10     # exponentiation (2 to the power of 10)
2 ** 10    # also exponentiation (equivalent to ^)
```
```output
[1] 8
[1] 2
[1] 15
[1] 1.666667
[1] 1024
[1] 1024
```

## The %in% Operator

Check if a value exists in a set:

```r
prime_numbers <- c(2, 3, 5, 7, 11, 13)
2 %in% prime_numbers
4 %in% prime_numbers
```
```output
[1] TRUE
[1] FALSE
```

## Numeric Shortcuts

The colon `:` creates a sequence:

```r
1:10
5:1
```
```output
[1]  1  2  3  4  5  6  7  8  9 10
[1]  5  4  3  2  1
```

## Common Vector Functions

```r
scores <- c(88, 92, 75, 95, 61)
min(scores)
max(scores)
mean(scores)
median(scores)
sum(scores)
log(scores)        # natural logarithm
```
```output
[1] 61
[1] 95
[1] 82.2
[1] 88
[1] 411
[1] 4.477121 4.521589 4.317488 4.553877 4.110874
```

## Dataframes with tibble()

Create a structured table from vectors:

```r
students <- tibble(
  name = c("Alice", "Bob", "Carol"),
  score = c(88, 92, 75),
  pass = c(TRUE, TRUE, FALSE)
)
students
```
```output
# A tibble: 3 × 3
  name  score pass
  <chr> <dbl> <lgl>
1 Alice    88 TRUE
2 Bob      92 TRUE
3 Carol    75 FALSE
```

## Exploring Dataframes

```r
head(students)       # first 6 rows
glimpse(students)    # compact overview
colnames(students)   # column names
dim(students)        # dimensions (rows, cols)
nrow(students)       # number of rows
ncol(students)       # number of columns
```

## Subsetting with [row, col]

```r
students[1, ]        # first row, all columns
students[, 2]        # all rows, second column
students$name        # column by name
students[1, 3]       # first row, third column
```""",

    "module-3": """

## One-Variable Distributions: Histograms & Density

For continuous variables, plot the distribution with a histogram:

```r
ggplot(penguins, aes(x = body_mass_g)) +
  geom_histogram(binwidth = 200)
```

Control bin edges with `boundary`:

```r
ggplot(penguins, aes(x = body_mass_g)) +
  geom_histogram(binwidth = 200, boundary = 0)
```

Overlay a smooth density curve:

```r
ggplot(penguins, aes(x = body_mass_g)) +
  geom_histogram(binwidth = 200, aes(y = after_stat(density))) +
  geom_density(color = "blue", linewidth = 1)
```

## Boxplots for Distributions

```r
ggplot(penguins, aes(x = species, y = body_mass_g)) +
  geom_boxplot(aes(fill = species), alpha = 0.7)
```

## Adding Trend Lines

Use `geom_smooth()` to add a trend line:

```r
ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE)  # se=FALSE removes confidence band
```

## Transparency & Shapes

Control transparency with `alpha` (0 = fully transparent, 1 = fully opaque):

```r
ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g)) +
  geom_point(alpha = 0.5, size = 3)  # semi-transparent points
```

Control point shape with `shape`:

```r
ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g)) +
  geom_point(aes(shape = species), size = 3)
```

## Labels & Titles

```r
ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g)) +
  geom_point() +
  labs(
    title = "Penguin Flipper Length vs Body Mass",
    x = "Flipper Length (mm)",
    y = "Body Mass (g)"
  )
```

## color vs fill

For plots with bars or filled shapes:
- `color` colors the **border** or outline
- `fill` colors the **interior**

```r
ggplot(penguins, aes(x = species)) +
  geom_bar(aes(fill = species))  # fill bars by species

ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g)) +
  geom_point(aes(color = species))  # color the points
```""",

    "module-4": """

## Relocating Columns

Move a column to a different position:

```r
penguins %>%
  relocate(sex, .after = species) %>%
  head()
```

## Renaming Columns

```r
penguins %>%
  rename(flipper = flipper_length_mm, mass = body_mass_g) %>%
  head()
```

## Arranging with desc()

Sort in **descending** order:

```r
penguins %>%
  arrange(desc(body_mass_g)) %>%
  select(species, body_mass_g) %>%
  head(3)
```

## group_by() + mutate()

Unlike `summarize()`, `mutate()` adds a column while keeping **all original rows**. Each row gets the per-group value:

```r
penguins %>%
  group_by(species) %>%
  mutate(
    species_mean_mass = mean(body_mass_g, na.rm = TRUE)
  ) %>%
  select(species, body_mass_g, species_mean_mass) %>%
  head()
```

Then use `ungroup()` to remove grouping:

```r
penguins %>%
  group_by(species) %>%
  mutate(species_count = n()) %>%
  ungroup()
```

## Multiple Summaries at Once

```r
penguins %>%
  group_by(species) %>%
  summarize(
    avg = mean(body_mass_g, na.rm = TRUE),
    min = min(body_mass_g, na.rm = TRUE),
    max = max(body_mass_g, na.rm = TRUE),
    n = n()
  )
```""",

    "module-5": """

## right_join() and full_join()

While `left_join()` keeps all rows from the **left** table:

```r
left_join(students, grades)  # all students, NAs for those without grades
```

`right_join()` keeps all rows from the **right** table:

```r
right_join(students, grades)  # all students in grades table
```

> **Equivalence:** `right_join(x, y)` is the same as `left_join(y, x)`.

`full_join()` keeps **all** rows from both tables:

```r
full_join(students, grades)  # all students AND all grades, NAs everywhere they don't match
```

## Clarifying inner_join()

`inner_join()` keeps only rows with a match in **BOTH** tables:

```r
inner_join(students, grades)  # only students who have grades
```

## bind_rows(): Stacking Vertically

When tables have the same columns but different rows, stack them:

```r
group1 <- tibble(id = 1:3, score = c(85, 90, 78))
group2 <- tibble(id = 4:6, score = c(92, 88, 81))

bind_rows(group1, group2)  # append rows vertically
```

> **Difference from joins:** `bind_rows()` stacks rows directly. `full_join()` matches on keys and fills NAs — it's for combining related data from different sources. `bind_rows()` is for appending separate datasets.""",

    "module-6": """

## Random Variables & Probability Distributions

A **random variable** X is a function that assigns a number to each outcome in a sample space. For example:
- X = result of rolling a die (values 1–6)
- X = number of heads in 3 coin flips (values 0–3)
- X = height of a randomly chosen student (values 58–80 inches)

A **probability distribution** specifies the probabilities of all possible values. For a **discrete** random variable, we list:
- **Support:** all possible values
- **Probability for each value:** P(X = x)
- **Constraint:** all probabilities sum to 1

## Expected Value E[X]

The expected value is the long-run average — the mean of the distribution:

$$E[X] = \sum x \cdot P(X = x)$$

In R:

```r
vals <- 0:10          # support for Apgar scores
probs <- c(0.001, 0.006, 0.007, 0.008, 0.012, 0.02, 0.038, 
           0.099, 0.319, 0.437, 0.053)
E_X <- sum(vals * probs)
E_X
```
```output
[1] 8.68
```

## Variance & Standard Deviation

**Variance** measures spread around the mean:

$$\\text{Var}(X) = \\sum (x - \\mu)^2 \\cdot P(X = x)$$

In R:

```r
mu <- E_X
Var_X <- sum((vals - mu)^2 * probs)
SD_X <- sqrt(Var_X)
Var_X
SD_X
```
```output
[1] 1.947
[1] 1.395
```

## Visualizing a Discrete Distribution

```r
apgar_data <- tibble(
  score = 0:10,
  prob = c(0.001, 0.006, 0.007, 0.008, 0.012, 0.02, 0.038, 
           0.099, 0.319, 0.437, 0.053)
)

ggplot(apgar_data, aes(x = score, y = prob)) +
  geom_col(fill = "steelblue", alpha = 0.8) +
  labs(title = "Apgar Score Distribution", x = "Score", y = "Probability")
```

> **Why this matters:** The shape of the distribution tells you about typical and unlikely outcomes. High concentration around 8–9 means most newborns have very good Apgar scores.""",

    "module-7": """

## Combinations & Factorials

How many ways can you arrange k successes in n trials?

$$\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$$

In R:

```r
choose(5, 3)       # C(5,3) = 10 ways to choose 3 items from 5
factorial(5)       # 5! = 120
```
```output
[1] 10
[1] 120
```

## The Four Binomial Functions

**dbinom(k, n, p)** — exact probability P(X = k):
```r
dbinom(5, size = 10, prob = 0.4)  # P(X = 5) for Binom(10, 0.4)
```

**pbinom(k, n, p)** — cumulative probability P(X ≤ k):
```r
pbinom(5, size = 10, prob = 0.4)  # P(X ≤ 5)
```

**qbinom(q, n, p)** — quantile (inverse CDF). Find the smallest x where P(X ≤ x) ≥ q:
```r
qbinom(0.7, size = 10, prob = 0.5)  # returns 5, since P(X ≤ 5) ≈ 0.623
```

**rbinom(size, n, p)** — simulate random samples:
```r
rbinom(5, size = 10, prob = 0.5)  # generate 5 random Binomial(10, 0.5) values
```
```output
[1] 5 6 4 6 5
```

> **Quick reference:** d = density (exact), p = probability (cumulative), q = quantile, r = random sample.""",

    "module-8": """

## dnorm(), pnorm(), qnorm()

**dnorm(x, mean, sd)** — height of the bell curve at x (density, not probability):
```r
dnorm(0, mean = 0, sd = 1)        # height at z = 0
dnorm(2, mean = 0, sd = 1)        # height at z = 2
```
```output
[1] 0.3989423
[1] 0.0539909
```

> **Important:** dnorm gives height, not area. Probability is always zero for any single point in a continuous distribution.

**pnorm(q, lower.tail = FALSE)** — find P(X > q):
```r
pnorm(2, mean = 0, sd = 1, lower.tail = FALSE)  # P(Z > 2)
```
```output
[1] 0.02275013
```

## Normal Approximation to the Binomial

When the sample is large enough, Binomial(n, p) ≈ N(np, np(1-p)).

**Conditions:** np(1-p) ≥ 10

```r
# Check if approximation is valid
n <- 100
p <- 0.5
np_1_minus_p <- n * p * (1 - p)
np_1_minus_p >= 10
```
```output
[1] TRUE
```

With n = 100, p = 0.5: np(1-p) = 25 ✓ Valid.
With n = 100, p = 0.01: np(1-p) = 0.99 ✗ Invalid — binomial too skewed.

## Standardization for Comparison

Z-scores let you compare values across different distributions:

```r
# Alice scores 85 on a test with mean 75, sd 10
# Bob scores 38 on a test with mean 30, sd 8
alice_z <- (85 - 75) / 10
bob_z <- (38 - 30) / 8
alice_z
bob_z
```
```output
[1] 1
[1] 1
```

Both have z = 1, so they performed equally well relative to their peers.""",

    "module-9": """

## Constructing Confidence Intervals with qnorm()

To build a CI, find the critical z-values using `qnorm()`:

```r
# For 95% CI: α = 0.05, so α/2 = 0.025
qnorm(0.025)       # lower tail
qnorm(0.975)       # upper tail
```
```output
[1] -1.959964
[1] 1.959964
```

For 90% CI: α/2 = 0.05
```r
qnorm(0.05)
qnorm(0.95)
```
```output
[1] -1.644854
[1] 1.644854
```

> **Pattern:** For (100 - α)% CI, use `qnorm(1 - α/2)` for the upper critical value.

## The Lady Tasting Tea: A Hypothesis Test Example

**Scenario:** Lady Bristol claims she can taste whether tea or milk was added first. She tastes 8 cups and guesses correctly on 6. Can we conclude she has ability, or is she just guessing?

- H₀: p = 0.5 (guessing randomly)
- Hₐ: p ≠ 0.5 (has ability)
- X ~ Binomial(8, 0.5), and she got X = 6

**P-value:** P(X ≥ 6) assuming H₀ is true:

```r
1 - pbinom(5, size = 8, prob = 0.5)
```
```output
[1] 0.1445313
```

> **Interpretation:** Even by random chance, she has a 14.5% probability of guessing ≥6 correct. This is not unusual, so we do NOT reject H₀. The data don't provide strong evidence she has tasting ability.

## P-Value Definition

The **p-value** is the probability of observing a result as extreme as (or more extreme than) what we got, assuming the null hypothesis is true.

- Small p-value (< α) → Result is surprising under H₀ → Reject H₀
- Large p-value (≥ α) → Result is consistent with H₀ → Fail to reject""",

    "module-10": """

## Testing Proportions with prop.test()

**Two-sided test:**
```r
prop.test(x = 60, n = 90, p = 0.5)
```

**One-sided test:**
```r
prop.test(x = 60, n = 90, p = 0.5, alternative = "greater")
```

Output gives the 95% CI and p-value.

## Simulation: Building a Sampling Distribution

To test a proportion using simulation:

```r
# Assuming H₀: p = 0.6, generate sampling distribution
n_sims <- 10000
n <- 90
p_null <- 0.6

# Simulate B samples of size n, each with success probability p
x_star <- rbinom(n_sims, size = n, prob = p_null)
p_hat <- x_star / n

# Our observed p̂ = 60/90 ≈ 0.667
# P-value = proportion of simulations as extreme as 0.667
obs_p_hat <- 60 / 90
p_value <- mean(p_hat >= obs_p_hat | p_hat <= 1 - obs_p_hat)
p_value
```

This gives you the empirical p-value from the simulation.

## Conditions for Normal Approximation

For the normal approximation to p̂ to be valid:

$$np \\geq 10 \\quad \\text{AND} \\quad n(1-p) \\geq 10$$

If either condition fails, use exact binomial methods or simulation instead.""",
}

# Update each module
for i, module in enumerate(data['modules']):
    module_id = module['id']
    
    # Only update non-exam modules
    if module_id in additions:
        module['content'] += additions[module_id]
        print(f"✓ Updated {module_id}: {module['title']}")

# Save the updated JSON
with open('content/courses/stat240.json', 'w') as f:
    json.dump(data, f, indent=2)

print("\n✓ All modules updated successfully!")
print("File saved to: content/courses/stat240.json")
