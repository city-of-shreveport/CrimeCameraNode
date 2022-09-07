# Expanded Heartbeat Data
This data is included in the standard heartbeat packet under `health.services`,
and in several files under `/mnt/ramdisk/services`.

Each file contains at least a `status` and a `date` field, which are used to
compute the overall health of the system (the worst status of all subsystems,
with data that is too old being treated as an emergency).

Note about units: There is not much consistency in units since each subsystem
either tries to provide convenient units, or easy-to-access units. However,
storage units are always reported with base 2 conventions: i.e. kibibytes (1024)
not kilobytes (1000), mebibytes (1024\*1024) not megabytes (1000\*1000), etc..

***

## Hardware Status Subsystem
* File: `/mnt/ramdisk/services/hwStatus.json`
* JSON: `health.services.hwStatus`

### `status`
* type: `string`
* values:
	* `"healthy"`: everything looks ok.
	* `"degraded"`: one of: one mass storage device is missing, one mass storage device is attached to a low speed port, the CPU is reporting throttling, or CPU temps are over 75C.
	* `"critical"`: two of the above (counting the drives separately)
	* `"emergency"`: three or more of the above

### `date`
* type: `number` (JS timestamp)

### `uptime`
* type: `object`
* source: `uptime`

#### `uptime.up`
* type: `string`
* description: straight out of the `uptime` utility, usually looks like `"N days, HH:MM"`, with days omitted for short uptimes

#### `uptime.users`
* type: `number`
* description: number of logged in users

#### `uptime.load`
* type: `object`

##### `uptime.load.1min`
* type: `number`
* description: the CPU load average over the last 1 minute. 1.00 = 1 CPU core fully utilized

##### `uptime.load.5min`
* type: `number`
* description: the CPU load average over the last 5 minutes. 1.00 = 1 CPU core fully utilized

##### `uptime.load.15min`
* type: `number`
* description: the CPU load average over the last 15 minutes. 1.00 = 1 CPU core fully utilized

### `disks`
* type: `object`
* source: `df --output=target,size,used,avail --block-size=K`

#### `disks.<diskname>`
* type: `object`
* description: each disk has a sub-object representing it.
* `<diskname>` values:
	* `"root"`: the disk mounted at `/`
	* `"boot"`: the disk mounted at `/boot`
	* `"video"`: the primary video disk, at `/home/pi/videos`
	* `"buddy"`: the backup video disk, at `/home/pi/remote_backups`
	* `"ramdisk"`: the ramdisk, at `/mnt/ramdisk`

##### `disks.<diskname>.path`
* type: `string`
* description: the mount path of the drive

##### `disks.<diskname>.size`
* type: `number`
* description: the total capacity of the disk, measured in kibibytes.

##### `disks.<diskname>.used`
* type: `number`
* description: used space on the disk, measured in kibibytes.

##### `disks.<diskname>.avail`
* type: `number`
* description: available space on the disk, measured in kibibytes.

##### `disks.<diskname>.usedPercent`
* type: `number`
* description: percentage of disk that is used (used/size), measured in percentage points (i.e. 5.00 = 5%)

### `ram`
* type: `object`
* source: `free -wk`

#### `ram.<type>`
* description: memory and swap are broken down separately
* `<type>` values:
	* `"memory"`: ram
	* `"swap"`: swap space. Note that this objet contains only `total`, `used`, `free`, and `usedPercent`

##### `ram.<type>.total`
* type: `number`
* description: the total amount of memory, measured in kibibytes

##### `ram.<type>.used`
* type: `number`
* description: the amount of used memory, measured in kibibytes

##### `ram.<type>.free`
* type: `number`
* description: the amount of free memory, measured in kibibytes

##### `ram.<type>.shared`
* type: `number`
* description: the amount of shared memory, measured in kibibytes

##### `ram.<type>.buffers`
* type: `number`
* description: the amount of buffer memory, measured in kibibytes

##### `ram.<type>.cache`
* type: `number`
* description: the amount of cache memory, measured in kibibytes

##### `ram.<type>.available`
* type: `number`
* description: the approximate amount of available memory (approximately free + buffers + cache), measured in kibibytes

##### `ram.<type>.usedPercent`
* type: `number`
* description: percentage of memory that is used (used/size), measured in percentage points (i.e. 5.00 = 5%)

### `pi`
* type: `object`
* source: `vcgencmd`

#### `pi.temperatureC`
* type: `number`
* source: `vcgencmd measure_temp`
* description: the video core's tempeature, in &deg;C. This will be higher than ambient temps.

#### `pi.throttled`
* type: `object`
* source: `vcgencmd get_throttled`

##### `pi.throttled.raw`
* type: `number`
* description: the raw value of the `vcgencmd get_throttled` command. Non-0 means some throttling has occurred.

###### `pi.throttled.<type>`
* type: `object`
* description: the raw value is a bitfield, these objects break out the specific booleans.
* `<type>` values:
	* `"current"`: throttling that is applying right now
	* `"occurred"`: set if any throttling has occurred since boot, even if no longer active

###### `pi.throttled.<type>.underVoltage`
* type: `boolean`
* description: if the CPU/GPU core has detected an under voltage event

###### `pi.throttled.<type>.armFreqCapped`
* type: `boolean`
* description: if the CPU/GPU core has had its frequency capped

###### `pi.throttled.<type>.throttled`
* type: `boolean`
* description: if the CPU/GPU core has been throttled

###### `pi.throttled.<type>.softTempLimit`
* type: `boolean`
* description: if the CPU/GPU core has hit the temperature limit

### `pi.clock`
* type: `object`
* source: `vcgencmd measure_clock`

#### `pi.clock.cpu`
* type: `number`
* description: the CPU's clock speed, in hertz
* source: `vcgencmd measure_clock arm`

#### `pi.clock.sdCard`
* type: `number`
* description: the SD card's clock speed, in hertz
* source: `vcgencmd measure_clock emmc`

### `pi.volts`
* type: `object`
* source: `vcgencmd measure_volts`

#### `pi.volts.core`
* type: `number`
* description: the voltage of the video core
* source: `vcgencmd measure_volts core`

#### `pi.volts.sdram_c`
* type: `number`
* description: the voltage of the ram controller
* source: `vcgencmd measure_volts sdram_c`

#### `pi.volts.sdram_i`
* type: `number`
* description: the voltage of the ram i/o bus
* source: `vcgencmd measure_volts sdram_i`

#### `pi.volts.sdram_p`
* type: `number`
* description: the voltage of the physical ram
* source: `vcgencmd measure_volts sdram_p`

### `usb`
* type: `array`
* source: `lsusb -t`
* description: an array of hubs, each of which contains children (which are typically devices), which may hav more children, based on how devices are plugged in.

#### `usb.*<hub>.bus`
* type: `string`

#### `usb.*<hub|device>.port`
* type: `number`

#### `usb.*<hub|device>.dev`
* type: `number`

#### `usb.*<hub|device>.class`
* type: `string`

#### `usb.*<hub|device>.speed`
* type: `string`
* description: formatted like `"<usbver>/speed"` -- for example, `3/5Gbps` or `2/480Mbps`

#### `usb.*<hub|device>.children`
* type: `array`

### `bandwidth`
* type: `object`
* source: file `/proc/net/dev`

#### `bandwidth.<interface>`
* type: object
* values:
	* `"cellular"`: the cellular connection.
	* `"eth0"`: apparently unused
	* `"eth1"`: cameras
	* `"eth2"`: unknown
	* `"lo"`: loopback device
	* `"wlan0"`: wifi

##### `bandwidth.<interface>.in`
* type: `number` (or, rarely, `string`)
* description: the average incoming / download speed, measured since the last heartbeat, in kibibytes per second. Note: the first heartbeat after startup, this returns N/A since it cannot measure a delta.

##### `bandwidth.<interface>.out`
* type: `number` (or, rarely, `string`)
* description: same as `bandwidth.<interface>.in`, except measuring the outgoing / upload speed.

***

## Software Status Subsystem
* File: `/mnt/ramdisk/services/swStatus.json`
* JSON: `health.services.swStatus`

### `status`
* type: `string`
* values:
	* `"healthy"`: everything looks ok.
	* `"degraded"`: any pm2 module has an increasing number of restarts
	* `"emergency"`: any pm2 module's status is not `"online"`

### `date`
* type: `number` (JS timestamp)

### `pm2`
* type: `array`
* description: status of pm2 tasks
* source: `pm2` module (similar to `pm2 status`)

#### `pm2.*`
* type: `object`

##### `pm2.*.name`
* type: `string`
* description: the name of the pm2 task (such as `"start"`)

##### `pm2.*.status`
* type: `string`
* description: the status of the pm2 task (such as `"online"`)

##### `pm2.*.id`
* type: `number`
* description: the numeric id of the pm2 task

##### `pm2.*.pid`
* type: `number`
* description: the process id of the pm2 task

##### `pm2.*.restarts`
* type: `number`
* description: the number of non-clean restarts (not affected by `pm2 restart`)

##### `pm2.*.uptimeHours`
* type: `number`
* description: the number of hours the pm2 task has been running

##### `pm2.*.memoryMB`
* type: `number`
* description: the amount of RAM used by the pm2 task, in mebibytes.

##### `pm2.*.cpu`
* type: `number`
* description: the percent CPU this task is using (i.e. 5.00 = 5%). note that this value is often elevated because the value is measured right after most tasks have just run. The steady-state value is often quite a bit lower

### `git`
* type: `object`
* source: `git status --porcelain -b` and `git rev-parse HEAD`

#### `git.<repo>`
* type: `object`
* `<repo>` values:
	* `"crimecameranode"`: our primary repo
	* `"nvrjs"`: NVR-JS repo
	
##### `git.<repo>.branch`
* type: `string`
* the branch name

##### `git.<repo>.commit`
* type: `string`
* description: the commit hash

##### `git.<repo>.ahead`
* type: `number`
* description: how many commits ahead of upstream (as of last `git fetch`) we are

##### `git.<repo>.behind`
* type: `number`
* description: how many commits behind upstream (as of last `git fetch`) we are

##### `git.<repo>.dirtyFiles`
* type: `number`
* description: how many files with uncomitted changes there are.

***

## Storage Subsystem
* File: `/mnt/ramdisk/services/setupStorage.json`
* JSON: `health.services.setupStorage`

### `status`
* type: `string`
* values:
	* `"healthy"`: both drives are functioning correctly. System may still be misconfigured (i.e. wrong keys), but the drives are healthy and the system should be functional.
	* `"degraded"`: one drive is missing, and the remaining drive is doing double duty. The system should be stable but it needs attention sooner than later.
	* `"critical"`: one drive is missing, and the other could not be used for both purposes at once. One of the video streams is being written to the SD card. System needs attention now.
	* `"emergency"`: both drives are missing, and both streams are being written to the SD card. System needs attention yesterday.

### `date`
* type: `number` (JS timestamp)

### `video`
* type: `object`
* description: this summarizes the status of the primary video drive. Note that the boolean properties are sequential: once one is false, properties beyond that point may or may not be present or have sane values.
* source: `lsblk`, `mount`, and `blkid`

#### `video.exists`
* type: `boolean`
* description: whether the device is detected at all

#### `video.deviceName`
* type: `string`
* description: the device name (such as `"sdb"`)

#### `video.devicePath`
* type: `string`
* description: the device path (such as `"/dev/sdb"`)

#### `video.deviceSize`
* type: `number`
* description: the total size of the drive, in bytes

#### `video.partitioned`
* type: `boolean`
* description: whether the drive was partitioned

#### `video.partitionName`
* type: `string`
* description: the partition name (such as `"sdb1"`)

#### `video.partitionPath`
* type: `string`
* description: the partition path (such as `"/dev/sdb1"`)

#### `video.luksFormatted`
* type: `boolean`
* description: whether the drive was encrypted with `cryptsetup luksFormat`

#### `video.luksOpened`
* type: `boolean`
* description: whether the drive was opened with `cryptsetup luksOpen`

#### `video.luksName`
* type: `string`
* description: the name of the drive, currently sanitized

#### `video.luksPath`
* type: `string`
* description: the drive path in `/dev/mapper`, currently sanitized

#### `video.mounted`
* type: `boolean`
* description: whether the drive was successfully mounted

#### `video.mountPaths`
* type: `array` of `string`
* description: the mount paths. Usually 1 item long, unless one drive is serving double-duty

#### `video.ioWorked`
* type: `boolean`
* description: whether a quick I/O test (writing, reading, and unlinking a file) succeeded.

### `buddy`
* type: `object`
* description: this is identical to the `video` property, except for the backup drive

### `fails`
* type: `object`
* description: fail counter for each drive

#### `fails.video`
* type: `number`
* description: how many times in a row the video drive has failed to get set up cleanly

#### `fails.video_hwm`
* type: `number`
* description: the largest value `fails.video` ever achieved since startup.

#### `fails.buddy`
* type: `number`
* description: how many times in a row the backup drive has failed to get set up cleanly

#### `fails.buddy_hwm`
* type: `number`
* description: the largest value `fails.buddy` ever achieved since startup.

***

## Storage Watchdog Subsystem
* File: `/mnt/ramdisk/services/hwStatus.json`
* JSON: `health.services.hwStatus`

### `status`
* type: `string`
* values:
	* `"healthy"`: unconditionally set

### `date`
* type: `number` (JS timestamp)

### `roots`
* type: `array`
* description: each "root" is a single physical disk, which may have multiple cameras and systems (live / backup) on it.
* source: `df` and `du`

#### `roots.*`
* type: `object`

##### `roots.*.roots`
* type: `array` of `string`
* description: the paths for each camera stored on this drive

##### `roots.*.device`
* type: `number`
* description: opaque unique device identifier

##### `roots.*.size`
* type: `number`
* description: total size of the video and metadata files, in bytes

##### `roots.*.oldest`
* type: `number` (JS timestamp)
* description: the date of the oldest video or metadata file found.

##### `roots.*.newest`
* type: `number` (JS timestamp)
* description: the date of the newest video or metadata file found.

##### `roots.*.files`
* type: `number`
* description: how many files are present. Note that metadata files that can be associated with video files are not counted separately, but bare metadata files are.

##### `roots.*.gigsPerHour`
* type: `number`
* description: a *very* crude approximation of how fast data is being written, in gibibytes per hour. Note that this can be very inaccurate if a device was off for a long time, as it is simply calculated by dividing the `size` by the difference in time between `oldest` and `newest`.

##### `roots.*.hoursOfFootage`
* type: `number`
* description: a *very* crude approximation of many hours of footage are stored, again based entirely on `oldest` and `newest`, so possibly inaccurate if the device was not recording for long periods.

##### `roots.*.driveStats`
* type: `object`

###### `roots.*.driveStats.size`
* type: `number`
* description: the total size of the drive, in bytes

###### `roots.*.driveStats.used`
* type: `number`
* description: the total amount of space used on the drive, in bytes

###### `roots.*.driveStats.avail`
* type: `number`
* description: the total amount of space available on the drive, in bytes

###### `roots.*.driveStats.reserve`
* type: `number`
* description: the amount of storage reserved by the watchdog system: once `avail` drops below this, the oldest video and metadata files will be removed to get it back above this.

##### `roots.*.approximateCapacityHours`
* type: `number`
* description: another *very approximate* field, for how many hours of video are expected to fit on this drive (after accounting for the `reserve` space), assuming the current rate of usage via `gigsPerHour`. All the same caveats apply.

##### `roots.*.cleanup`
* type: `object`
* description: cleanup stats for the most recent pass

###### `roots.*.cleanup.removed`
* type: `number`
* description: how files were removed, again not counting metadata associated with video data, but counting bare metadata files. Associated metadata files are always removed along with their video files.

###### `roots.*.cleanup.expected`
* type: `number`
* description: how many bytes the deletion was expected to free

###### `roots.*.cleanup.actual`
* type: `number`
* description: how many bytes the deletion actually freed. This might be lower than `expected` if some removed files had multiple links, or if new files were written during deletion. This might be higher than `expected` if, for example, directory entries were cleaned up. If the values are ever drastically different, something has likely gone wrong, but if they are within a few percent of each other, it is probably fine.
