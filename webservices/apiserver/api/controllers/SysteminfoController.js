/* Copyright (c) 2020 Intel Corporation.

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/**
 * SysteminfoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const si = require("systeminformation");
module.exports = {
  async retrieve(req, res) {
    const osinfo = await si.osInfo();
    sysDistro = `${osinfo.distro} ${osinfo.release}`;
    const meminfo = await si.mem();
    sysMemUsage = Number(meminfo.active / 1073741824).toFixed(2);
    sysMemSize = Number(meminfo.total / 1073741824).toFixed(2);
    percentageMem = Number((sysMemUsage / sysMemSize) * 100).toFixed(2);

    const fsinfo = await si.fsSize();
    sysDiskUsage = Number(fsinfo[0].used / 1073741824).toFixed(2);
    sysDiskSize = Number(fsinfo[0].size / 1073741824).toFixed(2);
    percentageDisk = Number((sysDiskUsage / sysDiskSize) * 100).toFixed(2);

    const netinfo = await si.networkStats();
    sysNetworkRXBit = Math.abs(
      Number((netinfo[0].rx_sec / 1024) * 8).toFixed(2)
    );

    const curInfo = await si.currentLoad();
    sysAvgLoad = Number(curInfo.avgload).toFixed(2);
    sysCurrentLoad = Number(curInfo.currentload).toFixed(2);

    const cpuinfo = await si.cpu();
    sysCPUModel = `${cpuinfo.manufacturer} ${cpuinfo.brand}`;
    sysCPUCount = cpuinfo.cores;

    const graphic = await si.graphics();
    try {
      graphicModel = graphic.controllers[0].model;
    } catch {
      graphicModel = "Unknown";
    }

    const cpuModel = {
      sysCPUModel: sysCPUModel,
      sysCPUCount: sysCPUCount,
    };

    const mem = {
      sysMemUsage: sysMemUsage,
      sysMemSize: sysMemSize,
      percentageMem: percentageMem,
    };

    const disk = {
      sysDiskUsage: sysDiskUsage,
      sysDiskSize: sysDiskSize,
      percentageDisk: percentageDisk,
    };
    const info = {
      memory: mem,
      disk: disk,
      netinfo: sysNetworkRXBit,
      cpu: sysCurrentLoad,
      cpuModel: cpuModel,
      graphics: graphicModel,
      os: sysDistro,
    };
    res.json(info);
  },
};
