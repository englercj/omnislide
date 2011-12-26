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
COMPILER_GET = wget http://closure-compiler.googlecode.com/files/compiler-latest.zip -O ${COMPILER_FILE} && unzip ${COMPILER_FILE} compiler.jar -d ${BUILD_DIR}
COMPILER = ${BUILD_DIR}/compiler.jar
COMPILE = java -jar ${COMPILER} --js ${COMBINED} --js_output_file ${MINIFIED}

RHINO_FILE = rhino
RHINO_GET = wget ftp://ftp.mozilla.org/pub/mozilla.org/js/rhino1_7R3.zip -O ${RHINO_FILE}.zip && unzip ${RHINO}.zip ${RHINO_FILE}.jar -d ${BUILD_DIR}
RHINO = ${BUILD_DIR}/${RHINO_FILE}.jar
HINT = java -jar ${BUILD_DIR}/${RHINO_FILE}.jar ${BUILD_DIR}/jshint-rhino.js ${COMBINED}

#JQ_VER = $(shell cat version.txt)
#VER = sed "s/@VERSION/${JQ_VER}/"

#DATE=$(shell git log -1 --pretty=format:%ad)

all: setup combine minify hint #size
	@@echo "OmniSlide build complete."

setup: ${BUILD_DIR} ${DIST_DIR} ${COMPILER} ${RHINO}

combine: setup ${COMBINED}

minify: setup combine ${MINIFIED}

hint: setup combine
	@@if test -e ${RHINO}; then
		echo "Checking OmniSlide against JSHint..."; \
		${HINT} \
	else \
		echo "Rhino has not been downloaded, please run 'make setup'"; \
	fi

${BUILD_DIR}:
	@@mkdir -p ${BUILD_DIR}

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

${RHINO}:
	@@if test ! -e ${RHINO}; then \
		echo "Downloading rhino..."; \
		${RHINO_GET}; \
	fi

${COMPILER}:
	@@if test ! -e ${COMPILER}; then \
		echo "Downloading compiler..."; \
		${COMPILER_GET}; \
	fi

${COMBINED}: ${MODULES} | ${DIST_DIR}
	@@echo "Building to: " ${COMBINED}

	@@cat ${MODULES} > ${COMBINED} #| \
#sed 's/.function..jQuery...{//' | \
#sed 's/}...jQuery..;//' | \
#sed 's/@DATE/'"${DATE}"'/' | \
#${VER} > ${JQ};

${MINIFIED}: ${COMBINED}
	@@if test -e ${COMPILER}; then \
		echo "Minifying to: " ${MINIFIED}; \
		${COMPILE}; \
	else \
		echo "Compiler not downloaded, please run 'make setup'"; \
	fi

#size: jquery min
#	@@if test ! -z ${JS_ENGINE}; then \
		gzip -c ${JQ_MIN} > ${JQ_MIN}.gz; \
		wc -c ${JQ} ${JQ_MIN} ${JQ_MIN}.gz | ${JS_ENGINE} ${BUILD_DIR}/sizer.js; \
		rm ${JQ_MIN}.gz; \
	else \
		echo "You must have NodeJS installed in order to size jQuery."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
	@@echo "Removing downloaded tools"
	@@rm -rf ${BUILD_DIR}/compiler.* ${BUILD_DIR}/${RHINO_FILE}.*