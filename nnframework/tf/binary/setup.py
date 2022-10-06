# INTEL CONFIDENTIAL
#
# Copyright 2019 Intel Corporation.
#
# This software and the related documents are Intel copyrighted materials, and your use of
# them is governed by the express license under which they were provided to you ("License").
# Unless the License provides otherwise, you may not use, modify, copy, publish, distribute,
# disclose or transmit this software or the related documents without Intel's prior written
# permission.
#
# This software and the related documents are provided as is, with no express or implied
# warranties, other than those that are expressly stated in the License.

# cython: language_level=3

import numpy as np

import os
import sys
import subprocess

from distutils.core import setup
from distutils.extension import Extension
from Cython.Distutils import build_ext
from Cython.Build import cythonize

args = sys.argv[1:]

if "cleanall" in args:
    print("Deleting cython files...")
    subprocess.Popen("rm -rf build", shell=True, executable="/bin/bash")
    subprocess.Popen("rm -rf *.c", shell=True, executable="/bin/bash")
    subprocess.Popen("rm -rf *.so", shell=True, executable="/bin/bash")
    sys.argv[1] = "clean"

if args.count("build_ext") > 0 and args.count("--inplace") == 0:
    sys.argv.insert(sys.argv.index("build_ext") + 1, "--inplace")

os.environ['ARCHFLAGS'] = "-arch x86_64"


def scan_dir_for_py(dir, files=[]):
    for file in os.listdir(dir):
        path = os.path.join(dir, file)
        if os.path.isfile(path) and path.endswith(".py"):
            files.append(path.replace(os.path.sep, ".")[2:-3])
        elif os.path.isdir(path):
            scan_dir_for_py(path, files)
    return files


def createExtension(ext):
    path = ext.replace(".", os.path.sep) + ".py"
    return Extension(
        ext,
        [path],
        language="c++"
    )


extensions = scan_dir_for_py(".")

# and build up the set of Extension objects
extensionList = [createExtension(name) for name in extensions]


setup(
    name="deploy",
    ext_modules=cythonize(extensionList),
    cmdclass={'build_ext': build_ext},
)
