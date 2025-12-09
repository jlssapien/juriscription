import { createSignal, createMemo, For, Show } from "solid-js";

// Helper function moved here
const getValenceColor = (valence) => {
  if (valence === "Good") return "green";
  if (valence === "Bad") return "#C7262C";
  return "gray";
};

export default function EventList({ events }) {
  const [sortMethod, setSortMethod] = createSignal("default");
  const [filterCategory, setFilterCategory] = createSignal("All");

  // Get unique categories for the dropdown
  const categories = ["All", ...new Set(events.map((e) => e.category))];

  // The Magic: This automatically recalculates when signals change
  const derivedEvents = createMemo(() => {
    let result = [...events];

    // 1. Filter
    if (filterCategory() !== "All") {
      result = result.filter((item) => item.category === filterCategory());
    }

    // 2. Sort
    if (sortMethod() === "prob_desc") {
      result.sort((a, b) => b["P(generalises)"] - a["P(generalises)"]);
    } else if (sortMethod() === "prob_asc") {
      result.sort((a, b) => a["P(generalises)"] - b["P(generalises)"]);
    }

    return result;
  });

  return (
    <section class="entries">
      <div class="filters">
        <div>
          Sort by:
          <select onChange={(e) => setSortMethod(e.currentTarget.value)}>
            <option value="default">Default</option>
            <option value="prob_desc">Probability (High to Low)</option>
            <option value="prob_asc">Probability (Low to High)</option>
          </select>
        </div>
        <div>
          Filter:
          <select onChange={(e) => setFilterCategory(e.currentTarget.value)}>
            <For each={categories}>{(cat) => <option value={cat as string}>{cat}</option>}</For>
          </select>
        </div>
      </div>

      <For each={derivedEvents()}>
        {(item) => (
          <div class="entry">
            <div class="probs">
              <div
                class="probs-true"
                style={{
                  width: `${item["P(generalises)"] * 100}%`,
                  border: "solid 1px " + getValenceColor(item.valence),
                  "border-right": "none",
                  "--stripe-color": getValenceColor(item.valence),
                }}
              />
            </div>

            <div class="content">
              <h3>{item.summary}</h3>
              <Show when={item.commentary}>
                <details>
                  <summary>+</summary>
                  <div>{item.commentary}</div>
                </details>
              </Show>
            </div>

            <div class="categories">
              <div>{item.category}</div>
              <div>{item.subcategory}</div>
              <div>{item.subsub}</div>
            </div>

            <div class="links">
              {/* Add your logic for icons here based on item.evidence */}
              {item.evidence && <div>{item.evidence}</div>}
              {item.primary_source && (
                <a href={item.primary_source} class="pill">
                  ○ PRIMARY SOURCE
                </a>
              )}
            </div>
          </div>
        )}
      </For>
    </section>
  );
}
