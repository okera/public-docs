---
permalink: cluster-administration
---
# Cluster Administration

This document describes how to use the CLI for administering running clusters.
Refer to the [Installation](install) document for details on how to create new clusters.

> **Note:** A single Deployment Manager can administer multiple ODAS clusters.

## Prerequisites

The utility `ocadm` must be installed and configured to the Deployment Manager.
You can ensure connectivity by using:

```shell
ocadm status
```

## Scaling an Existing Cluster

An existing cluster can be scaled to a new size.
Scaling is performed from the CLI using the update command:

```shell
ocadm clusters update --numNodes=<desired size> <cluster_id>
```

**Example:** Scaling cluster 1's number of nodes to 20:

```shell
ocadm clusters update --numNodes=20 1
```

This command is used to scale a cluster up or down in size.
Okera manages the underlying machines life cycle by launching new ones, and terminating scaled down ones, as required.

> **Note:** The cluster must have been created using either the `--launchScript` or
`--clusterLaunchScript` options.

## Setting the Number of Planners

Okera, by default, picks the number of planners to run.
The optimal number of planners depends on the environment and workload. For users who desire to fine tune the cluster, the number of planners is controlled using the `clusters update` command.

```shell
ocadm clusters update --numPlanners=<number> <cluster_id>
```

> **Note**
> The planner number cannot exceed the cluster size.
> It requires restarting the cluster for the change to take effect.

## Enabling Termination Protection

Clusters can be configured to use EC2's termination protection feature.
When enabled, termination protection prevents the cluster from being scaled or terminated without first disabling it.
This disabling and enabling cycle prevents the accidental misconfiguration of a running cluster.

To enable or disable terminal protection:

```shell
ocadm clusters update \
 --terminationProtectionEnabled=<true|false> <cluster_id>
```

**Example:** Enabling termination protection for cluster 5
```shell
ocadm clusters update --terminationProtectionEnabled=true 5
```

## Upgrading an Existing Cluster

An existing cluster can be upgraded with a new version of ODAS components.
The CLI command is used to upgrade one or more components.
After upgrading the cluster, it is restarted with the upgraded components.

> **Note:** Both version and components options cannot be specified at the same time.

To upgrade all components in an existing cluster to a new version, specify version only.
To upgrade specific cluster components to a different version, specify components only.

```shell
ocadm clusters upgrade \
 --components=<components_version_list> <cluster_id>
```

```shell
ocadm clusters upgrade \
 --version <upgrade_version> <cluster_id>
```

**Note:** Specified components take the form of `component:version`.

**Example:** Upgrading cluster 2's ODAS components to version 1.0.0 and web UI to 1.0.1:
```shell
ocadm clusters upgrade --components=cdas:1.0.0,web-ui:1.0.1 2
```

**Example:** Upgrading all ODAS components in cluster 3 to version 0.4.5.
```shell
ocadm clusters upgrade --version=0.4.5 3
```

### Setting a New Cluster Version

To configure Deployment Manager so that new clusters use upgraded version of ODAS components, use the `set_default_version` command.
Exceptions can be assigned with the `--components` option.

```shell
ocadm clusters set_default_version \
 --version=<upgrade_version> \
 --components=<components_version_list> <cluster_id>
```

**Example:** Setting new clusters to 1.0.0, with the planner and workers at 1.0.1

```shell
ocadm clusters set_default_version --version=1.0.0 --components=cdas:1.0.1
```

> **Note:** The `--components` option is required. It may be specified as an empty string("").

## Checking Cluster Status

Use the `list` command to query the status of all clusters controlled by Deployment Manager.

```shell
ocadm clusters list
```

**Example:** Cluster list command results
```shell
description      id  name       numNodes  numRunningServices    owner    statusCode    statusMessage                                                                           type
-------------  ----  -------  ----------  --------------------  -------  ------------  --------------------------------------------------------------------------------------  ------------------
                137  cluster1          1  7/7                   admin    READY         All services running.                                                                   STANDALONE_CLUSTER
```

The `numRunningServices` value indicates which services are currently passing their health checks.
The services are always enumerated in a fixed order, enabling an administrator to understand which services are up and healthy.


The set of services running on a given cluster depends on the cluster's configuration.
Refer to the [Cluster Types](cluster-types) document for the listing that applies to your given setup.

As an example, consider the situation where a standalone cluster had an issue with the planner configuration where the planner could not start up.
In that scenario, the number of running services would be listed as `3/7`.
The first three services (canary, zookeeper, and catalog) would all pass health checking successfully.
The fourth service (planner) would not pass a health check successfully.

The state of services 5, 6 and 7 are not known in that situation.
Services with higher numbers depend on a subset of the services with lower numbers.
Lower-numbered services having issues preclude a higher-numbered service from correctly providing its full range of functionality.

A service successfully passing its health check does not preclude it from returning an error on a given request.
Rather, it indicates that the service was able to startup successfully, including passing all initial service configuration validations.
The service responded to the most recent Deployment Manager request to its health check endpoint.

## Cluster diagnosis

It may occassionally be helpful to gather system logs from the nodes in a cluster when
a functional issue or performance issue occurs. A cluster can be commanded to compile
a gzipped tar-ball of all system logs over the previous day and upload the archive to
a cluster's S3 logging bucket with a simple command:

  ```shell
  ocadm clusters diag 137
  ```

This produces the following output:

  ```shell
  A tar-gzip file containing cluster logs will be uploaded to the following path shortly:
  s3://contoso-logging-bucket/diagnostics/2018-04-06-21-03-15-614/cluster1/bb717d32-253e-4617-a504-5bec14ace6f7/okera_diag_1_1.tgz
  ```

Additionally, the cluster can be commanded to compile logs for a specified number of days
in the past and upload the tarball to a preferred S3 URI path with a specific file name:

  ```shell
  ocadm clusters diag --days 3 --file analytics_hiccup.tar.gz --s3-upload-path s3://contoso-private/analytics-team 137
  ```

This produces the following output:

  ```shell
  A tar-gzip file containing cluster logs will be uploaded to the following path shortly:
  s3://contoso-private/analytics-team/diagnostics/2018-04-06-21-48-18-769/cluster1/2fe5d94d-9b0d-4dac-b3b9-6a721dc3fe98/analytics_hiccup.tar.gz
  ```

In the example above, the cluster with id '137' was commanded to package system logs that
were written within the previous 3 days and to upload the resulting tarball to a specific
S3 path with a specific filename.

## Synchronizing Roles and Permissions between Catalog/Sentry and Planner nodes

The Planner refreshes its roles from the Catalog every 60 seconds.
Any changes made directly to the Sentry database in the Catalog might take up to a minute to reflect in the Planner nodes.

Planner nodes cache the role and permissions information from the Catalog.
When multiple Planner nodes are present in a ODAS cluster, a policy is followed of eventual consistency for maintaining cache coherence.
This policy could be fine tuned in the future if needed.
