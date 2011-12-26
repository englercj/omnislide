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

#JQ_VER = $(shell cat version.txt)
#VER = sed "s/@VERSION/${JQ_VER}/"

#DATE=$(shell git log -1 --pretty=format:%ad)

all: setup combine minify hint size
	@@echo "OmniSlide build complete."

setup: ${BUILD_DIR} ${DIST_DIR} ${COMPILER} ${RHINO}

combine: ${COMBINED}

minify: combine ${MINIFIED}

hint: combine
	@@if test -e ${RHINO}; then \
		echo "Checking OmniSlide against JSHint..."; \
		${HINT} ${COMBINED}; \
	else \
		echo "Rhino has not been downloaded, please run 'make setup'"; \
	fi

${BUILD_DIR}:
	@@mkdir -p ${BUILD_DIR}

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

${RHINO}:
	@@if test ! -e ${RHINO}; then \
		echo "Setting up Rhino..."; \
		${RHINO_GET}; \
		echo "Done!"; \
	fi

${COMPILER}:
	@@if test ! -e ${COMPILER}; then \
		echo "Setting up Google Closue Compiler..."; \
		${COMPILER_GET}; \
		echo "Done!"; \
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

size: combine minify
	@@gzip -c ${MINIFIED} > ${MINIFIED}.gz;
	@@wc -c ${COMBINED} ${MINIFIED} ${MINIFIED}.gz;
	@@rm ${MINIFIED}.gz;

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}

clean-tools:
	@@echo "Removing downloaded tools"
	@@rm -rf ${BUILD_DIR}/compiler.* ${BUILD_DIR}/rhino.*