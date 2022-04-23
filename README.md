# City of Shreveport's Open Source Public Safety Camera

This repository is one of several that composes a simple system for secure storage, access, and retrieval of commodity ONVIF cameras connected over PoE to a Raspberry Pi. 

Currently, the Bill of Materials for this project is under $1500 and is meant to be a "plug and play" system once configured: power it and walk away. 

No need to setup massive storage solutions, no need to pay for every frame of video being backhauled to hard drives - once it is plugged in and connected to your ZeroTier network, IT/Infrastructure configuration is done.

Each box is meant to be a self-contained system. 

## Motivations

### Why Public Safety Cameras At All?

Over 85 cities have a Real Time Crime Center to date. 

They help Law Enforcement professionals with valuable evidence. When video evidence is involved, the solve rates are much higher and suspects are apprehended sooner. 

But crime is not the only reasons for these devices. Cities deal with people who dump toxic chemicals into our water, they deal with tire dumping and blight issues that are difficult to correct without evidence.

As well, Real Time Crime Centers provide valuable services to LE professionals that help save dozens of man hours per incident. In our city, where there is a major officer shortage, this is incredibly valuable. 

### Why Build Your Own (DIY)?

Many vendors have approached us offering camera installations, but nearly all of them offer only centralized solutions with several single points of failure (backhaul failure, data center failures, VPN failures, storage failure, hacks giving full access to EVERY camera, and more). 

These approaches felt absurd in an era where edge compute is a possibility.

Further, most solutions do not contain systems that will be useful in court (checksum of video file stored outside of the system for verification, as one example). 

While building the system, we were asked dozens of questions by LE professionals around the many problems they faced, and proceeded to build a system that fit their needs.

### Why Open Source?

Surveillance of public spaces with no expectations of privacy is legal: locally, at the state level, and federally. 

But that doesn't mean that citizens are always 100% for these tools that help officers and city personnel.

Often, these sorts of deployments are done with a vendor that is looking to take data generated and sell it for a profit, or mine the data for other insights to gain profit. 

Nearly always, vendor solutions are proprietary and closed source, and often inflexible to new and emerging technology without steep fees. 

As citizens ourselves, we wanted a system where anyone can look at the source code and understand what we're doing and how we're doing it - not because we told them, but because anyone can read the code and surmise for themselves how it functions.

This level of transparency in surveillance systems deployed in cities is unprecedented. 

Finally, we are not the only city who needs an affordable, flexible, open solution, and hope other mid-sized cities see our work and join the project.

## Overview: How this works?

### The Physical Components

In short:

1. Enclosure
1. Power Supply
1. Powered USB Hub
1. PoE Switch
1. ONVIF capable camera (anything that can spit out an RTSP stream)
1. USB Ethernet Port (one port is used for PoE network, one for Backhaul)
1. Modem or Connected Network (backhaul) 
1. Raspberry Pi!

### The Software Components

What we are doing is fairly simple. There are a lot of moving parts, but the basic concepts are easy to follow:

1. Use RaspberryPi as a consumer of a video feed
1. Create a secure tunnel to the RaspberryPi using ZeroTier (decentralized VPN)
1. Using FFMPEG and various FFMPEG tools, store the RTSP streams to disk in 15 minute chunks for easy retrieval, and store each chunk's metadata locally and within RTCC
1. Bridge the network between the PoE Camera and the RaspberryPi to transmit lower quality real-time streams
1. Store metadata in MongoDB locally, then replicate to datacenter when possible

This project focuses on the "box" on the pole with cameras attached. The other key projects are:

1. CrimeCameraServer: The back-end NodeJS application for a basic RTCC interface.
1. CrimeCameraClient: The front-end application that allows you to see camera systems on a map, pull their low quality feed, and download clips

