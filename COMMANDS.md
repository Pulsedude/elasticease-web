# ⚡ Elasticease Web — Command Reference Manual

Welcome to the comprehensive command manual for **Elasticease Web**. The built-in interactive terminal allows developers, DevOps engineers, and cluster administrators to manage, inspect, query, and mutate Elasticsearch clusters without memorizing verbose cURL commands or constructing complex REST payloads by hand.

---

## 📑 Quick Navigation

- [CLI Syntax & Parser Rules](#-cli-syntax--parser-rules)
- [Command Categories](#-command-categories)
  - [1. Cluster Management](#1-cluster-management)
    - [`cluster:health`](#clusterhealth)
    - [`cluster:stats`](#clusterstats)
    - [`cluster:nodes`](#clusternodes)
    - [`cluster:settings`](#clustersettings)
    - [`cluster:inspect`](#clusterinspect)
  - [2. Index Operations](#2-index-operations)
    - [`index:list`](#indexlist)
    - [`index:inspect`](#indexinspect)
    - [`index:search`](#indexsearch)
    - [`index:get`](#indexget)
    - [`index:data`](#indexdata)
    - [`index:create`](#indexcreate)
    - [`index:delete`](#indexdelete)
    - [`index:mappings`](#indexmappings)
    - [`index:settings`](#indexsettings)
    - [`index:stats`](#indexstats)
    - [`index:count`](#indexcount)
    - [`index:refresh`](#indexrefresh)
    - [`index:flush`](#indexflush)
  - [3. Document Operations (CRUD)](#3-document-operations-crud)
    - [`document:get`](#documentget)
    - [`document:insert`](#documentinsert)
    - [`document:update`](#documentupdate)
    - [`document:delete`](#documentdelete)
  - [4. Bulk Operations](#4-bulk-operations)
    - [`bulk:insert`](#bulkinsert)
    - [`bulk:update`](#bulkupdate)
    - [`bulk:delete`](#bulkdelete)
  - [5. Node Diagnostics & Telemetry](#5-node-diagnostics--telemetry)
    - [`node:settings`](#nodesettings)
    - [`node:os`](#nodeos)
    - [`node:process`](#nodeprocess)
    - [`node:jvm`](#nodejvm)
    - [`node:plugins`](#nodeplugins)
    - [`node:http`](#nodehttp)
    - [`node:ingest`](#nodeingest)
    - [`node:remote_cluster_server`](#noderemote_cluster_server)
    - [`node:usage`](#nodeusage)
    - [`node:transport`](#nodetransport)
    - [`allocation:list` / `node:allocation`](#allocationlist--nodeallocation)
    - [`nodes:list` / `node:list`](#nodeslist--nodelist)
    - [`node:stats`](#nodestats)
  - [6. Shard Management](#6-shard-management)
    - [`shards:list`](#shardslist)
- [AI Summarization Flag](#-ai-summarization-flag)
- [Back to Project Documentation](#-back-to-project-documentation)

---

## 🛠 CLI Syntax & Parser Rules

The Elasticease terminal parser supports flexible, shell-like input semantics:

1. **Positional Arguments**: Arguments can be passed in order as separated tokens:
   ```bash
   index:inspect logs-prod-2026 mapping true
   ```
2. **Named Key-Value Pairs**: Arguments can be explicitly named using `key=value`:
   ```bash
   index:inspect index=logs-prod-2026 info_type=mapping json=true
   ```
3. **Quoted Values**: Wrap strings containing spaces or punctuation in single or double quotes:
   ```bash
   document:insert index=customer_v1 id="user 984"
   ```
4. **Boolean Flags**: Flags can be written as `true`/`false`, `1`/`0`, or with leading dashes:
   ```bash
   cluster:health json=true
   shards:list --unassigned
   ```
5. **Interactive Document & Mapping Builders**: Commands such as `index:create with_mapping=true`, `document:insert`, and `document:update` trigger intuitive modal / interactive prompt builders in the web terminal for effortless schema construction.

---

## 📂 Command Categories

---

### 1. Cluster Management

Cluster commands let you inspect the top-level topology, cluster state, settings, and health status of your Elasticsearch deployment.

#### `cluster:health`
- **Description**: Retrieves the active cluster health report (status `green`, `yellow`, `red`, shard counts, and pending tasks).
- **Backend Endpoint**: `GET /v1/core/cluster_inspect?info_type=health`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `json` | `boolean` | No | `false` | `true`, `false` | If `true`, returns raw JSON. If `false`, prints a clean metric table. |
- **Examples**:
  ```bash
  cluster:health
  cluster:health json=true
  ```

#### `cluster:stats`
- **Description**: Returns detailed operational statistics for the cluster, including total document count, storage size in bytes, heap utilization, and indices breakdown.
- **Backend Endpoint**: `GET /v1/core/cluster_inspect?info_type=stats`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `json` | `boolean` | No | `true` | `true`, `false` | Output format format flag. |
- **Examples**:
  ```bash
  cluster:stats
  cluster:stats json=false
  ```

#### `cluster:nodes`
- **Description**: Lists all nodes participating in the cluster, displaying node names, transport addresses, operating system roles, and Elasticsearch versions.
- **Backend Endpoint**: `GET /v1/core/nodes`
- **Arguments**: None.
- **Examples**:
  ```bash
  cluster:nodes
  ```

#### `cluster:settings`
- **Description**: Inspects transient and persistent cluster settings configured on the active master node.
- **Backend Endpoint**: `GET /v1/core/cluster_inspect?info_type=settings`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `json` | `boolean` | No | `true` | `true`, `false` | Return format flag. |
- **Examples**:
  ```bash
  cluster:settings
  ```

#### `cluster:inspect`
- **Description**: Low-level cluster inspector providing access to individual cluster endpoints.
- **Backend Endpoint**: `GET /v1/core/cluster_inspect`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `info_type` | `enum` | **Yes** | — | `health`, `stats`, `settings`, `state` | The specific cluster state domain to query. |
  | `json` | `boolean` | No | `true` | `true`, `false` | Formats response as JSON when `true`. |
- **Examples**:
  ```bash
  cluster:inspect state
  cluster:inspect info_type=health json=false
  ```

---

### 2. Index Operations

Create, delete, flush, refresh, and inspect metadata, mappings, and stored documents across Elasticsearch indices.

#### `index:list`
- **Description**: Lists all indices with health color, open/closed status, document counts, deleted doc counts, primary store size, and total store size.
- **Backend Endpoint**: `GET /v1/core/indices`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `json` | `boolean` | No | `false` | `true`, `false` | Raw JSON or tabular output. |
  | `ai_summarization` | `boolean` | No | `false` | `true`, `false` | AI-generated executive summary of index distribution. |
- **Examples**:
  ```bash
  index:list
  index:list json=true
  index:list ai_summarization=true
  ```

#### `index:inspect`
- **Description**: Inspects specific index metadata, schema mappings, index settings, statistics, or aliases.
- **Backend Endpoint**: `POST /v1/core/index_inspect`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Any valid index name | Target index name. |
  | `info_type` | `string` | **Yes** | — | `mapping`, `settings`, `stats`, `aliases` | Target sub-property. |
  | `ai_summarization` | `boolean` | No | `false` | `true`, `false` | Ask AI to summarize the metadata. |
  | `json` | `boolean` | No | `false` | `true`, `false` | Return format. |
- **Examples**:
  ```bash
  index:inspect my_index mapping
  index:inspect index=audit-logs info_type=settings ai_summarization=true
  ```

#### `index:search`
- **Description**: Search-oriented index inspector with optional parameter defaults.
- **Backend Endpoint**: `POST /v1/core/index_inspect`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `index_name` | `index` | **Yes** | — | String | Index name. |
  | `info_type` | `string` | No | `""` | `mapping`, `settings`, `stats`, `aliases` | Sub-property name. |
  | `json` | `boolean` | No | `false` | `true`, `false` | Output format. |
  | `ai_summarization` | `boolean` | No | `false` | `true`, `false` | Enable AI explanation. |
- **Examples**:
  ```bash
  index:search products stats
  ```

#### `index:get` / `index:data`
- **Description**: Retrieves and inspects stored documents from an index using the search API.
- **Backend Endpoint**: `POST /v1/crud/index_data_inspect`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | String | Target index name. |
  | `size` | `number` | No | `100` | Integer `1` to `10000` | Maximum documents to retrieve. |
  | `json` | `boolean` | No | `false` | `true`, `false` | Formatted table or raw hits array. |
- **Examples**:
  ```bash
  index:data customers 50
  index:get index=inventory size=200 json=true
  ```

#### `index:create`
- **Description**: Creates a new Elasticsearch index with optional custom field schema mappings.
- **Backend Endpoint**: `PUT /v1/crud/create_index`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `index_name` | `string` | **Yes** | — | Lowercase alphanumeric index name | New index name. |
  | `with_mapping` | `boolean` | No | `false` | `true`, `false` | If `true`, launches the interactive schema builder. |
- **Examples**:
  ```bash
  index:create ecommerce_orders
  index:create index_name=users with_mapping=true
  ```

#### `index:delete`
- **Description**: Permanently drops an existing index and removes all associated shards and documents.
- **Backend Endpoint**: `DELETE /v1/crud/delete_index?name={index}`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Existing index name | Index to delete. |
  | `confirm` | `boolean` | No | `false` | `true`, `false` | Bypass confirmation prompt if `true`. |
- **Examples**:
  ```bash
  index:delete test_index
  index:delete index=staging_cache confirm=true
  ```

#### `index:mappings`
- **Description**: Shorthand helper to retrieve only field mappings for the specified index.
- **Backend Endpoint**: `POST /v1/core/index_inspect` (`info_type="mapping"`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
- **Examples**:
  ```bash
  index:mappings employees
  ```

#### `index:settings`
- **Description**: Shorthand helper to fetch shard replica count, refresh intervals, and analyzers.
- **Backend Endpoint**: `POST /v1/core/index_inspect` (`info_type="settings"`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
- **Examples**:
  ```bash
  index:settings employees
  ```

#### `index:stats`
- **Description**: Shorthand helper to fetch indexing, query, merge, and segment stats for an index.
- **Backend Endpoint**: `POST /v1/core/index_inspect` (`info_type="stats"`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
- **Examples**:
  ```bash
  index:stats analytics_v2
  ```

#### `index:count`
- **Description**: Returns exact document counts for an index.
- **Backend Endpoint**: `POST /v1/core/index_inspect` (`info_type="count"`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `json` | `boolean` | No | `false` | Return format. |
  | `ai_summarization`| `boolean` | No | `false` | AI summary. |
- **Examples**:
  ```bash
  index:count transactions
  index:count index=transactions json=true
  ```

#### `index:refresh` & `index:flush`
- **Description**:
  - `index:refresh`: Explicitly makes recent operations available for search.
  - `index:flush`: Forces an index flush to write memory segments to disk.
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
- **Examples**:
  ```bash
  index:refresh products
  index:flush products
  ```

---

### 3. Document Operations (CRUD)

Perform single-document CRUD operations with full support for Elasticsearch Optimistic Concurrency Control (OCC) using `_seq_no` and `_primary_term`.

#### `document:get`
- **Aliases**: `document:inspect`, `doc:get`, `doc:inspect`
- **Description**: Fetches and inspects a single document by its unique `_id`.
- **Backend Endpoint**: `GET /v1/crud/doc_inspect?index_name={index}&doc_id={id}`
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `id` | `string` | **Yes** | — | Document ID. |
  | `json` | `boolean` | No | `false` | Raw JSON or card inspector view. |
- **Examples**:
  ```bash
  document:get customers cust_101
  doc:get index=orders id="ord-2026-99" json=true
  ```

#### `document:insert`
- **Aliases**: `doc:insert`
- **Description**: Inserts a new document. If executed without interactive flags, prompts you in the terminal with an interactive JSON / field editor.
- **Backend Endpoint**: `POST /v1/crud/insert_doc`
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `id` | `string` | No | Auto-generated | Optional custom document ID. |
- **Examples**:
  ```bash
  document:insert users
  document:insert index=users id=usr_42
  ```

#### `document:update`
- **Aliases**: `doc:update`
- **Description**: Fetches the existing document, inspects `_seq_no` & `_primary_term`, and applies partial updates safely with OCC conflict protection.
- **Backend Endpoint**: `POST /v1/crud/update_doc`
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `id` | `string` | **Yes** | — | Target document ID. |
- **Examples**:
  ```bash
  document:update customers cust_101
  doc:update index=products id="prod-555"
  ```

#### `document:delete`
- **Aliases**: `doc:delete`
- **Description**: Deletes a single document permanently from the target index.
- **Backend Endpoint**: `DELETE /v1/crud/delete_doc?index_name={index}&document_id={id}`
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `id` | `string` | **Yes** | — | Target document ID. |
- **Examples**:
  ```bash
  document:delete customers cust_101
  doc:delete index=orders id=ord_99
  ```

---

### 4. Bulk Operations

Bulk operations allow inserting, updating, or deleting thousands of documents in a single HTTP request using NDJSON under the hood.

#### `bulk:insert`
- **Aliases**: `document:bulk-insert`, `document:bulk_insert`, `document:bulk:insert`
- **Description**: Uploads a `.json` file containing an array of documents to bulk insert into an index.
- **Backend Endpoint**: `POST /v1/crud/bulk_insert` (`multipart/form-data`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `file` | `file` | **Yes** | — | Path or file selection dialog. |
  | `json` | `boolean` | No | `false` | Raw response or tabular summary. |
- **Required JSON Format**:
  ```json
  [
    { "id": "1", "name": "Alice", "role": "admin" },
    { "id": "2", "name": "Bob", "role": "engineer" }
  ]
  ```
- **Examples**:
  ```bash
  bulk:insert customers ./customers_batch.json
  bulk:insert index=products file=products.json json=true
  ```

#### `bulk:update`
- **Aliases**: `document:bulk-update`, `document:bulk_update`, `document:bulk:update`
- **Description**: Bulk updates existing documents from a `.json` file. Each document item **must** include an `id` or `_id` field.
- **Backend Endpoint**: `POST /v1/crud/bulk_update` (`multipart/form-data`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `file` | `file` | **Yes** | — | JSON file containing updates with `id` keys. |
  | `json` | `boolean` | No | `false` | Return format. |
- **Examples**:
  ```bash
  bulk:update customers ./customer_updates.json
  ```

#### `bulk:delete`
- **Aliases**: `document:bulk-delete`, `document:bulk_delete`, `document:bulk:delete`
- **Description**: Bulk deletes documents matching the list of IDs in a JSON file.
- **Backend Endpoint**: `POST /v1/crud/bulk_delete` (`multipart/form-data`)
- **Arguments**:
  | Argument | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `index` | `index` | **Yes** | — | Target index name. |
  | `file` | `file` | **Yes** | — | JSON file containing `[{"id": "1"}, ...]` or `["1", "2"]`. |
  | `json` | `boolean` | No | `false` | Return format. |
- **Examples**:
  ```bash
  bulk:delete customers ./obsolete_ids.json
  ```

---

### 5. Node Diagnostics & Telemetry

Inspect detailed low-level metrics per node or cluster-wide.

| Command | Category | Purpose | Subsystem Inspected |
| :--- | :--- | :--- | :--- |
| `node:settings [node]` | Node | Cluster & Node configurations | Node-level settings |
| `node:os [node]` | Node | Host OS telemetry | CPU, Memory, Arch |
| `node:process [node]` | Node | Process information | Open file descriptors, CPU % |
| `node:jvm [node]` | Node | Java Virtual Machine health | Heap memory, GC metrics |
| `node:plugins [node]` | Node | Installed modules | Plugins, elasticsearch modules |
| `node:http [node]` | Node | HTTP communication | Bound addresses, open connections |
| `node:ingest [node]` | Node | Ingest pipeline stats | Pipelines, processors count |
| `node:remote_cluster_server` | Node | Cross-cluster search | Remote connections |
| `node:usage [node]` | Node | Feature usage metrics | Rest, aggregation usage |
| `node:transport [node]` | Node | Transport subsystem | Port 9300 traffic, network |
| `allocation:list` | Node | Disk space allocation | Free space, disk %, shard counts |
| `nodes:list` / `node:list` | Node | Quick node summary table | Roles, Master node marker |
| `node:stats [node] [metric]` | Node | Deep stats drill-down | Selective metric filter |

- **Common Optional Arguments for Node Commands**:
  - `node`: Node name or ID (defaults to all cluster nodes if omitted).
  - `json=true|false`: Format output as raw JSON or styled metric cards.
  - `ai_summarization=true|false`: Summarizes the technical telemetry in plain English.

- **Examples**:
  ```bash
  node:jvm
  node:jvm node-primary-01 json=true
  node:os ai_summarization=true
  allocation:list
  node:stats node=node-1 metric=jvm
  ```

---

### 6. Shard Management

#### `shards:list`
- **Description**: Lists all primary and replica shards across the cluster, displaying shard ID, status (`STARTED`, `UNASSIGNED`, `RELOCATING`), node assignment, and store size.
- **Backend Endpoint**: `GET /v1/core/shards`
- **Arguments**:
  | Argument | Type | Required | Default | Allowed Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `unassigned` | `boolean` | No | `false` | `true`, `false` | Filter to display **only** unassigned or problematic shards. |
  | `json` | `boolean` | No | `false` | `true`, `false` | Tabular view or raw JSON. |
  | `ai_summarization` | `boolean` | No | `false` | `true`, `false` | AI-assisted diagnosis of why shards might be unassigned. |
- **Examples**:
  ```bash
  shards:list
  shards:list unassigned=true
  shards:list unassigned=true ai_summarization=true
  ```

---

## 🤖 AI Summarization Flag

Every major diagnostic command in Elasticease supports `ai_summarization=true`. When toggled, Elasticease routes the cluster telemetry payload through your configured AI provider (**LiteLLM** or local **Ollama**):

```bash
# Example: Diagnose unassigned shards with AI
shards:list unassigned=true ai_summarization=true

# Example: Get an executive summary of cluster disk allocation
allocation:list ai_summarization=true
```

The AI engine analyzes shard states, disk thresholds, and memory pressure to provide clear, actionable insights directly in your terminal output.

---

## 🔗 Back to Project Documentation

- [Project README](./README.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Software License (MIT)](./LICENSE)
