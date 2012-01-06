SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

BASE_FILES = ${SRC_DIR}/jquery.omnislide.js\
	${SRC_DIR}/omnislide.transitionapi.js\

MODULES = ${SRC_DIR}/intro.js\
	${BASE_FILES}\
	${SRC_DIR}/outro.js

COMBINED = ${DIST_DIR}/jquery.omnislide.js
MINIFIED = ${DIST_DIR}/jquery.omnislide.min.js

COMPILER_FILE = ${BUILD_DIR}/compiler.zip
COMPILER_GET = wget -q http://closure-compiler.googlecode.com/files/compiler-latest.zip -O ${COMPILER_FILE} && unzip ${COMPILER_FILE} compiler.jar -d ${BUILD_DIR}
COMPILER = ${BUILD_DIR}/compiler.jar
COMPILE = java -jar ${COMPILER} --js ${COMBINED} --js_output_file ${MINIFIED}

RHINO_FILE = ${BUILD_DIR}/rhino.zip
RHINO_GET = wget -q ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip -O ${RHINO_FILE} && unzip ${RHINO_FILE} rhino1_7R3/js.jar -d ${BUILD_DIR} && mv ${BUILD_DIR}/rhino1_7R3/js.jar ${BUILD_DIR}/rhino.jar && rm -rf ${BUILD_DIR}/rhino1_7R3/
RHINO = ${BUILD_DIR}/rhino.jar
HINT = java -jar ${RHINO} ${BUILD_DIR}/jshint-rhino.js

DEMO_DIR = demo/
THEME_DIR = themes/
PACK_DIR = omnislide
PACK_FILE = omnislide.zip
PACKAGE = zip -rqb ${BUILD_DIR} ${DIST_DIR}/${PACK_FILE} ${PACK_DIR}

#JQ_VER = $(shell cat version.txt)
#VER = sed "s/@VERSION/${JQ_VER}/"

#DATE=$(shell git log -1 --pretty=format:%ad)

all: setup combine minify hint package size
	@@echo "OmniSlide build complete."

setup: ${DIST_DIR} ${COMPILER} ${RHINO}

combine: setup ${COMBINED}

minify: setup combine ${MINIFIED}

hint: setup combine
	@@if test -e ${RHINO}; then \
		echo "Checking OmniSlide against JSHint..."; \
		${HINT} ${COMBINED}; \
	else \
		echo "Rhino has not been downloaded, please run 'make setup'"; \
	fi

package: minify
	@@echo "Packaging omnislide..."
	@@if test ! -e ${PACK_DIR}; then \
		mkdir ${PACK_DIR}; \
	else \
		rm -rf ${PACK_DIR}; \
	fi
	@@cp -r ${MINIFIED} ${PACK_DIR}
	@@cp -r ${DEMO_DIR} ${PACK_DIR}
	@@cp -r ${THEME_DIR} ${PACK_DIR}
	@@${PACKAGE}
	@@rm -rf ${PACK_DIR}

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

${RHINO}:
	@@if test ! -e ${RHINO}; then \
		echo "Setting up Rhino..."; \
		${RHINO_GET}; \
	fi

${COMPILER}:
	@@if test ! -e ${COMPILER}; then \
		echo "Setting up Google Closure Compiler..."; \
		${COMPILER_GET}; \
	fi

${COMBINED}: ${MODULES} | ${DIST_DIR}
	@@echo "Building to: " ${COMBINED}

	@@cat ${MODULES} > ${COMBINED} #| \
#sed 's/.function..jQuery...{//' | \
#sed 's/}...jQuery..;//' | \
#sed 's/@DATE/'"${DATE}"'/' | \
#${VER} > ${JQ};

${MINIFIED}: combine
	@@if test -e ${COMPILER}; then \
		echo "Minifying to: " ${MINIFIED}; \
		${COMPILE}; \
	else \
		echo "Compiler not downloaded, please run 'make setup'"; \
	fi

size: setup combine minify
	@@echo "File Sizes:";
	@@gzip -c ${MINIFIED} > ${MINIFIED}.gz;
	@@du -h ${DIST_DIR}/*
	@@rm ${MINIFIED}.gz;

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}

clean-tools:
	@@echo "Removing downloaded tools"
	@@rm -rf ${BUILD_DIR}/compiler.* ${BUILD_DIR}/rhino.*